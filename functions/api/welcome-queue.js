/* =====================================================================
   GET /api/welcome-queue — liste des abonnés pas encore "souhaités bienvenue".
   Réservé à la GitHub Action (en-tête Authorization: Bearer <ADMIN_TOKEN>).
   Un abonné est "en attente" s'il n'a pas de clé KV  welcomed:<email>.
   ===================================================================== */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_TOKEN) return json({ error: 'server_misconfigured' }, 500);
  if ((request.headers.get('authorization') || '') !== 'Bearer ' + env.ADMIN_TOKEN) {
    return json({ error: 'unauthorized' }, 401);
  }

  const pending = [];
  let cursor;
  do {
    const list = await env.NEWSLETTER.list({ prefix: 'sub:', cursor });
    for (const k of list.keys) {
      const email = k.name.slice('sub:'.length);
      const welcomed = await env.NEWSLETTER.get('welcomed:' + email);
      if (!welcomed) pending.push(email);
    }
    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  return json({ count: pending.length, emails: pending });
}
