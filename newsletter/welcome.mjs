/* =====================================================================
   newsletter/welcome.mjs — envoie le mail de bienvenue aux nouveaux abonnés
   ---------------------------------------------------------------------
   Lancé automatiquement par la GitHub Action (.github/workflows/welcome.yml)
   toutes les ~15 min, ou à la main :  node --env-file=.env newsletter/welcome.mjs

   1. demande la liste des non-bienvenus à  GET /api/welcome-queue
   2. leur envoie le mail de bienvenue via Gmail
   3. les marque via  POST /api/welcome-mark  (pour ne jamais doublonner)
   ===================================================================== */

import { createHmac } from 'node:crypto';
import nodemailer from 'nodemailer';
import { renderWelcome } from './welcome-template.mjs';

const SUBJECT = 'Welcome to the garden 🌱';

function need(name) {
  const v = process.env[name];
  if (!v) { console.error(`✗ Missing env var ${name}.`); process.exit(1); }
  return v;
}

const cfg = {
  gmailUser:  need('GMAIL_USER'),
  gmailPass:  need('GMAIL_APP_PASSWORD'),
  from:       process.env.NEWSLETTER_FROM || `DDW 26 — The Purple Show <${process.env.GMAIL_USER}>`,
  siteUrl:   (process.env.SITE_URL || 'https://ddw26.pages.dev').replace(/\/$/, ''),
  adminToken: need('ADMIN_TOKEN'),
  hmacKey:    need('ALTCHA_HMAC_KEY'),     // signe les liens de désinscription
  delayMs:    Number(process.env.SEND_DELAY_MS || 1000),
};

function unsubscribeUrl(email) {
  const t = createHmac('sha256', cfg.hmacKey)
    .update('unsubscribe:' + email.trim().toLowerCase())
    .digest('hex');
  return `${cfg.siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&t=${t}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1. qui n'a pas encore reçu de bienvenue ?
  const res = await fetch(`${cfg.siteUrl}/api/welcome-queue`, {
    headers: { authorization: 'Bearer ' + cfg.adminToken },
  });
  if (!res.ok) throw new Error(`/api/welcome-queue -> ${res.status} ${await res.text()}`);
  const { emails } = await res.json();

  if (!emails.length) { console.log('No new subscribers to welcome.'); return; }
  console.log(`Welcoming ${emails.length} new subscriber(s)…`);

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
  });
  await transport.verify();

  // 2. envoi
  const sent = [];
  for (const email of emails) {
    const unsub = unsubscribeUrl(email);
    try {
      await transport.sendMail({
        from: cfg.from,
        to: email,
        subject: SUBJECT,
        html: renderWelcome({ unsubscribeUrl: unsub, siteUrl: cfg.siteUrl }),
        headers: { 'List-Unsubscribe': `<${unsub}>` },
      });
      console.log(`  ✓ ${email}`);
      sent.push(email);
    } catch (err) {
      console.error(`  ✗ ${email} — ${err.message}`);
    }
    await sleep(cfg.delayMs);
  }

  // 3. marque ceux qui ont bien reçu (idempotence)
  if (sent.length) {
    const mark = await fetch(`${cfg.siteUrl}/api/welcome-mark`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.adminToken },
      body: JSON.stringify({ emails: sent }),
    });
    console.log(mark.ok ? `Marked ${(await mark.json()).marked} as welcomed.` : `✗ mark failed: ${mark.status}`);
  }

  console.log(`Done. Welcomed ${sent.length}.`);
}

main().catch((err) => { console.error('\n✗ ' + err.message + '\n'); process.exit(1); });
