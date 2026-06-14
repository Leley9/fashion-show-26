/* =====================================================================
   GET /api/altcha — émet un défi ALTCHA signé pour le widget.
   Le widget appelle cette URL au chargement, résout le défi (preuve de
   travail), puis joint la solution à l'inscription.
   Pas d'en-tête CORS : seul le site (même origine) consomme ce défi.
   ===================================================================== */
import { createChallenge } from '../../lib/altcha.mjs';

export async function onRequestGet({ env }) {
  if (!env.ALTCHA_HMAC_KEY) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }
  const challenge = await createChallenge(env.ALTCHA_HMAC_KEY, {
    maxNumber: 50000,   // difficulté ≈ instantané pour un humain
    expiresSec: 600,    // le défi est valable 10 min
  });
  return new Response(JSON.stringify(challenge), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
