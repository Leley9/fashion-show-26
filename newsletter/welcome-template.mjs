/* =====================================================================
   newsletter/welcome-template.mjs — e-mail de bienvenue (solarpunk)
   Tout le CSS est en "inline" (contrainte des clients mail).
   ===================================================================== */

export function renderWelcome({ unsubscribeUrl, siteUrl }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef6e2;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You're in — welcome to the garden 🌱</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6e2;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#fffdf4;border-radius:22px;overflow:hidden;
                    box-shadow:0 14px 40px rgba(60,90,40,.16);font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">

        <tr><td style="background:linear-gradient(100deg,#ffd23f,#8be36b 55%,#2bd1c2);padding:34px;text-align:center;">
          <div style="font-size:30px;letter-spacing:2px;">🌱&nbsp;🌸&nbsp;🐝</div>
          <h1 style="margin:10px 0 0;font-size:26px;font-weight:800;color:#14250f;letter-spacing:.4px;">
            Welcome to the garden
          </h1>
        </td></tr>

        <tr><td style="padding:30px 34px;color:#23331c;font-size:16px;line-height:1.65;">
          <p style="margin:0 0 14px;">Hi there,</p>
          <p style="margin:0 0 14px;">
            You just subscribed to <strong>DDW 26 — The Purple Show</strong>. 🌷
            Once a week we'll send a short note: what we've built on the site and
            how the show is coming to life — street wear, plant dyes, second-hand
            textiles, and ecosystems that nourish rather than destroy.
          </p>
          <p style="margin:0 0 22px;">No spam, only sunlight. See you soon.</p>
          <p style="margin:0;text-align:center;">
            <a href="${siteUrl}"
               style="display:inline-block;padding:13px 22px;border-radius:14px;font-weight:700;
                      color:#14250f;text-decoration:none;
                      background:linear-gradient(100deg,#ffd23f,#8be36b 55%,#2bd1c2);">
              Wander the 3D space →
            </a>
          </p>
        </td></tr>

        <tr><td style="padding:22px 34px 30px;border-top:1px solid #e4eed6;color:#6c7a5f;font-size:12.5px;line-height:1.6;">
          <p style="margin:0;">
            Changed your mind?
            <a href="${unsubscribeUrl}" style="color:#6c7a5f;text-decoration:underline;">Unsubscribe</a>
            — no hard feelings. 🌾
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
