/* =====================================================================
   newsletter.js — UI d'inscription à la newsletter
   ---------------------------------------------------------------------
   • Ouvre/ferme la modale depuis le bouton du footer.
   • Récupère la solution du widget ALTCHA (preuve "pas un robot").
   • Envoie { email, altcha, website } à POST /api/subscribe.
   Volontairement séparé de scene.js : aucune dépendance à la 3D.
   ===================================================================== */

const openBtn  = document.getElementById('newsletter-btn');
const modal    = document.getElementById('newsletter-modal');
const closeBtn = document.getElementById('nl-close');
const form     = document.getElementById('nl-form');
const statusEl = document.getElementById('nl-status');
const emailEl  = document.getElementById('nl-email');
const widget   = document.getElementById('nl-altcha');

let altchaPayload = null;   // solution du défi, fournie par le widget

/* ---------- Ouverture / fermeture ---------- */
function openModal() {
  modal.classList.add('open');
  setTimeout(() => emailEl.focus(), 60);
}
function closeModal() {
  modal.classList.remove('open');
}

openBtn?.addEventListener('click', openModal);
closeBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});

/* ---------- État du widget ALTCHA ----------
   Le widget émet "statechange" ; on garde la solution quand state==='verified'. */
widget?.addEventListener('statechange', (e) => {
  altchaPayload = e.detail?.state === 'verified' ? e.detail.payload : null;
});

/* ---------- Messages d'état ---------- */
function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = kind;          // '', 'ok' ou 'err'
}

const ERRORS = {
  invalid_email:      'Hmm, that email looks off — mind checking it?',
  captcha_required:   'Please tick the anti-robot box first 🌱',
  captcha_failed:     'Anti-robot check failed — please try again.',
  captcha_replay:     'That check was already used — please tick it again.',
  rate_limited:       'Whoa, slow down a little 🌿 — please try again later.',
  server_misconfigured: 'Our garden hose is disconnected. Try again later.',
  bad_request:        'Something went wrong — please try again.',
};

/* ---------- Soumission ---------- */
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');

  const email = emailEl.value.trim();
  if (!email) return setStatus('Please enter your email.', 'err');
  if (!altchaPayload) return setStatus('Please tick the anti-robot box first 🌱', 'err');

  const submitBtn = form.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Planting…';

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        altcha: altchaPayload,
        website: form.website.value,   // honeypot (vide pour un humain)
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      setStatus(
        data.already ? "You're already growing with us 🌿" : "You're in! Welcome to the garden 🌱",
        'ok',
      );
      form.reset();
    } else {
      setStatus(ERRORS[data.error] || 'Something went wrong — please try again.', 'err');
    }
  } catch {
    setStatus('Network hiccup — please try again.', 'err');
  } finally {
    // Dans tous les cas, on redemande une nouvelle preuve pour le prochain envoi.
    altchaPayload = null;
    widget?.reset?.();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
  }
});
