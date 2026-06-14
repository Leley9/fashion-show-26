/* =====================================================================
   POST /api/subscribe — inscrit un e-mail à la newsletter.
   ---------------------------------------------------------------------
   Corps JSON attendu : { email, altcha, website }
     • altcha   : la solution du défi (preuve "je ne suis pas un robot")
     • website  : champ piège (honeypot) — un humain le laisse vide
   Défenses anti-robot : honeypot + limite par IP + preuve ALTCHA + anti-rejeu.
   Stockage : Cloudflare KV (binding NEWSLETTER), clé "sub:<email>".
   Pas d'en-tête CORS : seul le site (même origine) appelle cette API.
   ===================================================================== */
import { verifySolution } from '../../lib/altcha.mjs';

// Limite de débit par IP (anti-bourrage d'inscriptions).
const RATE_MAX = 8;          // tentatives autorisées…
const RATE_WINDOW = 3600;    // …par heure et par IP

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}

// Validation e-mail volontairement simple et tolérante.
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

// Compteur de débit par IP via KV (best-effort : simple ralentisseur, pas un verrou).
async function rateLimited(env, ip) {
  if (!ip) return false;                       // pas d'IP (dev local) -> on ne limite pas
  const key = 'rl:' + ip;
  const count = parseInt(await env.NEWSLETTER.get(key) || '0', 10);
  if (count >= RATE_MAX) return true;
  await env.NEWSLETTER.put(key, String(count + 1), { expirationTtl: RATE_WINDOW });
  return false;
}

export async function onRequestPost({ request, env }) {
  if (!env.ALTCHA_HMAC_KEY) return json({ error: 'server_misconfigured' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const altcha = body.altcha;
  const honeypot = String(body.website || '');

  // 1. Honeypot : rempli => robot. On répond "ok" sans rien stocker (silencieux).
  if (honeypot) return json({ ok: true });

  if (!isEmail(email)) return json({ error: 'invalid_email' }, 400);
  if (!altcha) return json({ error: 'captcha_required' }, 400);

  // 2. Limite de débit par IP (Cloudflare fournit CF-Connecting-IP).
  const ip = request.headers.get('cf-connecting-ip') || '';
  if (await rateLimited(env, ip)) return json({ error: 'rate_limited' }, 429);

  // 3. Preuve de travail ALTCHA.
  const verdict = await verifySolution(altcha, env.ALTCHA_HMAC_KEY);
  if (!verdict.ok) return json({ error: 'captcha_failed', reason: verdict.reason }, 403);

  // 4. Anti-rejeu : un même défi résolu ne peut servir qu'une fois.
  const replayKey = 'altcha:' + verdict.signature;
  if (await env.NEWSLETTER.get(replayKey)) return json({ error: 'captcha_replay' }, 403);
  const ttl = Math.max(60, (verdict.expires || 0) - Math.floor(Date.now() / 1000));
  await env.NEWSLETTER.put(replayKey, '1', { expirationTtl: ttl });

  // 5. Stockage idempotent de l'abonné.
  const key = 'sub:' + email;
  const existing = await env.NEWSLETTER.get(key);
  if (!existing) {
    await env.NEWSLETTER.put(key, JSON.stringify({
      email,
      subscribedAt: new Date().toISOString(),
      source: 'site',
    }));
  }

  return json({ ok: true, already: Boolean(existing) });
}
