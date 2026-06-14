/* =====================================================================
   GET /api/unsubscribe?email=...&t=...  — désinscription en un clic.
   Le lien est inclus en pied de chaque newsletter. Le jeton `t` est un
   HMAC de l'e-mail : impossible de désinscrire quelqu'un d'autre sans lui.
   Renvoie une petite page HTML (l'abonné clique depuis sa boîte mail).
   ===================================================================== */
import { unsubscribeToken } from '../../lib/altcha.mjs';

function page(title, message) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>${title}</title>
     <style>
       body{margin:0;min-height:100vh;display:grid;place-items:center;
         font-family:system-ui,sans-serif;color:#1d2b1f;
         background:radial-gradient(circle at 50% 30%,#fdf6d8,#d8f0c8 70%);}
       .card{max-width:420px;padding:38px 34px;text-align:center;
         background:rgba(255,255,255,.6);backdrop-filter:blur(14px);
         border:1px solid rgba(255,255,255,.7);border-radius:26px 30px 24px 32px;
         box-shadow:0 20px 60px rgba(60,90,40,.18);}
       h1{margin:0 0 10px;font-size:24px} p{margin:6px 0;opacity:.8;line-height:1.6}
     </style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export async function onRequestGet({ request, env }) {
  if (!env.ALTCHA_HMAC_KEY) return page('Oops', 'Server is misconfigured.');

  const url = new URL(request.url);
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
  const token = String(url.searchParams.get('t') || '');

  if (!email || !token) return page('Invalid link', 'This unsubscribe link is incomplete.');

  const expected = await unsubscribeToken(env.ALTCHA_HMAC_KEY, email);
  if (token !== expected) return page('Invalid link', 'This unsubscribe link is not valid.');

  await env.NEWSLETTER.delete('sub:' + email);
  return page('You’re unsubscribed 🌾', `${email} won’t receive our weekly note anymore. You can resubscribe anytime from the site.`);
}
