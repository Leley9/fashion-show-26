/* =====================================================================
   newsletter/template.mjs — gabarit HTML de l'e-mail (solarpunk)
   ---------------------------------------------------------------------
   Tout le CSS est en "inline" : les clients mail (Gmail, Apple Mail…)
   ignorent les feuilles de style externes. On reprend la palette du site.
   ===================================================================== */

export function renderEmail({ subject, contentHtml, unsubscribeUrl, siteUrl }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef6e2;">
  <!-- préheader caché -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(subject)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6e2;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#fffdf4;border-radius:22px;overflow:hidden;
                    box-shadow:0 14px 40px rgba(60,90,40,.16);font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">

        <!-- Bandeau dégradé soleil -> feuille -->
        <tr><td style="background:linear-gradient(100deg,#ffd23f,#8be36b 55%,#2bd1c2);padding:30px 34px;">
          <div style="font-size:22px;letter-spacing:2px;">🌱&nbsp;🌸&nbsp;🐝</div>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:800;color:#14250f;letter-spacing:.4px;">
            DDW 26 — The Purple Show
          </h1>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:30px 34px;color:#23331c;font-size:16px;line-height:1.65;">
          ${contentHtml}
        </td></tr>

        <!-- Pied -->
        <tr><td style="padding:22px 34px 30px;border-top:1px solid #e4eed6;color:#6c7a5f;font-size:12.5px;line-height:1.6;">
          <p style="margin:0 0 6px;">
            You’re receiving this because you subscribed on
            <a href="${siteUrl}" style="color:#2f9e57;text-decoration:none;">our site</a>.
            Grown without trackers. 🌾
          </p>
          <p style="margin:0;">
            <a href="${unsubscribeUrl}" style="color:#6c7a5f;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}
