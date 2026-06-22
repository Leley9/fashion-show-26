/* =====================================================================
   about.js — modale "About us"
   ---------------------------------------------------------------------
   • Ouvre/ferme la modale depuis le bouton "About" du header.
   • Même logique d'ouverture que la newsletter (clic sur le fond +
     touche Échap pour fermer). Aucune dépendance à la 3D.
   ===================================================================== */

const openBtn  = document.getElementById('about-btn');
const modal    = document.getElementById('about-modal');
const closeBtn = document.getElementById('about-close');

function openModal()  { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); }

openBtn?.addEventListener('click', openModal);
closeBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});
