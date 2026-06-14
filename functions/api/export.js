/* =====================================================================
   GET /api/export — liste des abonnés (réservé à l'envoi de la newsletter).
   Protégé par un jeton : en-tête  Authorization: Bearer <ADMIN_TOKEN>.
   Le script newsletter/send.mjs appelle cette URL pour récupérer les e-mails.
   ===================================================================== */
export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== 'Bearer ' + env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { 'content-type': 'application/json' },
    });
  }

  const emails = [];
  let cursor;
  do {
    const list = await env.NEWSLETTER.list({ prefix: 'sub:', cursor });
    for (const k of list.keys) emails.push(k.name.slice('sub:'.length));
    cursor = list.list_complete ? null : list.cursor;
  } while (cursor);

  return new Response(JSON.stringify({ count: emails.length, emails }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
