/* =====================================================================
   lib/altcha.mjs — ALTCHA proof-of-work, implémenté à la main
   ---------------------------------------------------------------------
   ALTCHA (https://altcha.org) est un captcha "preuve de travail" :
   le navigateur doit trouver un nombre `n` tel que SHA-256(salt + n)
   corresponde à un hash donné. Pas de pistage, pas de Google, RGPD-friendly.

   Ce module recrée le protocole avec l'API Web Crypto (zéro dépendance) :
   il tourne tel quel dans Cloudflare Pages Functions / Workers.

     • createChallenge()  -> le serveur émet un défi signé (HMAC)
     • verifySolution()   -> le serveur vérifie la solution renvoyée
     • unsubscribeToken() -> jeton anti-falsification pour les liens de désinscription

   La signature HMAC empêche un robot de fabriquer ses propres défis :
   seul le serveur (qui détient ALTCHA_HMAC_KEY) peut en signer.
   ===================================================================== */

const enc = new TextEncoder();

function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

async function sha256Hex(message) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return toHex(digest);
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

// Comparaison à temps constant (évite les attaques temporelles sur la signature).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------------------------------------------------------------------
   createChallenge — appelé par /api/altcha
   Renvoie l'objet JSON attendu par le widget <altcha-widget>.
   `maxNumber` règle la difficulté (≈ nb d'essais). 50 000 ≈ instantané
   sur un vrai navigateur, coûteux à grande échelle pour un botnet.
   --------------------------------------------------------------------- */
export async function createChallenge(hmacKey, { maxNumber = 50000, expiresSec = 600 } = {}) {
  const number = Math.floor(Math.random() * (maxNumber + 1));
  const expires = Math.floor(Date.now() / 1000) + expiresSec;
  // Le salt embarque l'expiration (format ALTCHA : "<hex>?expires=<unix>").
  const salt = randomHex(12) + '?expires=' + expires;
  const challenge = await sha256Hex(salt + number);
  const signature = await hmacSha256Hex(hmacKey, challenge);
  return { algorithm: 'SHA-256', challenge, maxnumber: maxNumber, salt, signature };
}

/* ---------------------------------------------------------------------
   verifySolution — appelé par /api/subscribe
   `payload` est la chaîne base64 produite par le widget (champ "altcha").
   Renvoie { ok, reason?, signature?, expires? }.
   --------------------------------------------------------------------- */
export async function verifySolution(payload, hmacKey) {
  let data;
  try {
    data = JSON.parse(atob(payload));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (!data || data.algorithm !== 'SHA-256' ||
      !data.salt || !data.challenge || !data.signature || data.number == null) {
    return { ok: false, reason: 'invalid' };
  }

  // 1. Expiration (lue dans le salt) — un défi périmé est rejeté.
  const query = data.salt.split('?')[1] || '';
  const expires = parseInt(new URLSearchParams(query).get('expires') || '0', 10);
  if (expires && Math.floor(Date.now() / 1000) > expires) {
    return { ok: false, reason: 'expired' };
  }

  // 2. La solution résout-elle vraiment le défi ?
  const expectedChallenge = await sha256Hex(data.salt + data.number);
  if (!safeEqual(expectedChallenge, data.challenge)) {
    return { ok: false, reason: 'bad_solution' };
  }

  // 3. Le défi a-t-il bien été signé par NOUS ? (anti-forgerie)
  const expectedSignature = await hmacSha256Hex(hmacKey, data.challenge);
  if (!safeEqual(expectedSignature, data.signature)) {
    return { ok: false, reason: 'bad_signature' };
  }

  return { ok: true, signature: data.signature, expires };
}

/* ---------------------------------------------------------------------
   unsubscribeToken — jeton signé pour les liens de désinscription.
   La même fonction est réimplémentée côté Node dans newsletter/send.mjs ;
   les deux DOIVENT produire le même résultat (HMAC-SHA256 de la même chaîne).
   --------------------------------------------------------------------- */
export function unsubscribeToken(hmacKey, email) {
  return hmacSha256Hex(hmacKey, 'unsubscribe:' + email.trim().toLowerCase());
}
