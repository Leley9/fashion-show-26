/* =====================================================================
   POST /api/welcome-mark — marque des abonnés comme "bienvenue envoyée".
   Réservé à la GitHub Action (Authorization: Bearer <ADMIN_TOKEN>).
   Corps JSON : { emails: ["a@b.com", ...] }
   Écrit une clé KV  welcomed:<email>  pour ne plus jamais les recontacter.
   ===================================================================== */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_TOKEN) return json({ error: 'server_misconfigured' }, 500);
  if ((request.headers.get('authorization') || '') !== 'Bearer ' + env.ADMIN_TOKEN) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const emails = Array.isArray(body.emails) ? body.emails : [];
  let marked = 0;
  const stamp = new Date().toISOString();
  for (const e of emails) {
    const email = String(e).trim().toLowerCase();
    if (!email) continue;
    await env.NEWSLETTER.put('welcomed:' + email, stamp);
    marked++;
  }

  return json({ ok: true, marked });
}
