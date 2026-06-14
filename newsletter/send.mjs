/* =====================================================================
   newsletter/send.mjs — envoi de la newsletter hebdo via Gmail
   ---------------------------------------------------------------------
   À lancer à la main chaque semaine :
       npm run newsletter            # envoie pour de vrai
       npm run newsletter -- --dry   # aperçu, sans rien envoyer

   Déroulé :
     1. lit le contenu de la semaine (newsletter/week.md)
     2. récupère les abonnés (Cloudflare KV via /api/export)
     3. envoie un e-mail personnalisé à chacun (lien de désinscription unique)

   Toute la config sensible vient des variables d'environnement (.env).
   ===================================================================== */

import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import nodemailer from 'nodemailer';
import { marked } from 'marked';
import { renderEmail } from './template.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry');

/* ---------- Config (.env) ---------- */
const cfg = {
  gmailUser:  need('GMAIL_USER'),                 // compte Gmail qui authentifie l'envoi
  gmailPass:  need('GMAIL_APP_PASSWORD'),         // mot de passe d'application (16 car.)
  from:       process.env.NEWSLETTER_FROM || `DDW 26 — The Purple Show <${process.env.GMAIL_USER}>`,
  siteUrl:   (process.env.SITE_URL || 'https://ddw26.pages.dev').replace(/\/$/, ''),
  exportUrl:  process.env.EXPORT_URL || '',       // .../api/export
  adminToken: process.env.ADMIN_TOKEN || '',      // pour /api/export
  hmacKey:    need('ALTCHA_HMAC_KEY'),            // pour signer les liens de désinscription
  weekFile:   process.env.WEEK_FILE || resolve(__dir, 'week.md'),
  delayMs:    Number(process.env.SEND_DELAY_MS || 1200),  // anti-throttle Gmail
};

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env var ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return v;
}

// Jeton de désinscription — DOIT être identique à lib/altcha.mjs (HMAC-SHA256 hex).
function unsubscribeToken(email) {
  return createHmac('sha256', cfg.hmacKey)
    .update('unsubscribe:' + email.trim().toLowerCase())
    .digest('hex');
}

function unsubscribeUrl(email) {
  const t = unsubscribeToken(email);
  return `${cfg.siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&t=${t}`;
}

/* ---------- 1. Contenu de la semaine ---------- */
async function loadWeek() {
  const raw = await readFile(cfg.weekFile, 'utf8');
  const lines = raw.split('\n');
  // La 1re ligne "# ..." sert de sujet ; le reste devient le corps.
  let subject = 'The Purple Show — weekly note';
  let bodyMd = raw;
  const h1 = lines.findIndex((l) => l.trim().startsWith('# '));
  if (h1 !== -1) {
    subject = lines[h1].replace(/^#\s+/, '').trim();
    bodyMd = lines.slice(h1 + 1).join('\n');
  }
  return { subject, contentHtml: marked.parse(bodyMd) };
}

/* ---------- 2. Abonnés ---------- */
async function loadSubscribers() {
  // Source A : endpoint /api/export protégé (recommandé).
  if (cfg.exportUrl && cfg.adminToken) {
    const res = await fetch(cfg.exportUrl, {
      headers: { authorization: 'Bearer ' + cfg.adminToken },
    });
    if (!res.ok) throw new Error(`/api/export -> ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.emails || [];
  }
  // Source B (repli hors-ligne) : un fichier local newsletter/subscribers.txt.
  try {
    const txt = await readFile(resolve(__dir, 'subscribers.txt'), 'utf8');
    return txt.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    throw new Error('No subscribers source. Set EXPORT_URL + ADMIN_TOKEN, or create newsletter/subscribers.txt');
  }
}

/* ---------- 3. Envoi ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { subject, contentHtml } = await loadWeek();
  const emails = await loadSubscribers();

  console.log(`\n🌱 ${subject}`);
  console.log(`   ${emails.length} subscriber(s) · from: ${cfg.from}` + (DRY_RUN ? '  [DRY RUN]' : ''));

  if (!emails.length) { console.log('   Nobody to send to yet.'); return; }

  const transport = DRY_RUN ? null : nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
  });
  if (transport) await transport.verify();

  let sent = 0, failed = 0;
  for (const email of emails) {
    const unsub = unsubscribeUrl(email);
    const html = renderEmail({ subject, contentHtml, unsubscribeUrl: unsub, siteUrl: cfg.siteUrl });

    if (DRY_RUN) { console.log(`   • would send -> ${email}`); sent++; continue; }

    try {
      await transport.sendMail({
        from: cfg.from,
        to: email,
        subject,
        html,
        // Permet le bouton "Se désabonner" natif des clients mail (meilleure délivrabilité).
        headers: { 'List-Unsubscribe': `<${unsub}>` },
      });
      console.log(`   ✓ ${email}`);
      sent++;
    } catch (err) {
      console.error(`   ✗ ${email} — ${err.message}`);
      failed++;
    }
    await sleep(cfg.delayMs);
  }

  console.log(`\nDone. Sent ${sent}, failed ${failed}.\n`);
}

main().catch((err) => { console.error('\n✗ ' + err.message + '\n'); process.exit(1); });
