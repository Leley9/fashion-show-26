/* =====================================================================
   weekly.js — Barre des semaines + lecteur de newsletter (scroll vertical)
   ---------------------------------------------------------------------
   • Génère, sous le header, une rangée de rectangles "Week 1, 2, 3…"
     à partir de weeks.js (rien à toucher ici pour ajouter une semaine).
   • Au clic : ouvre un lecteur plein écran qui empile les pages WebP,
     scrollables verticalement.  ✕ / clic dehors / Échap pour fermer.
   ===================================================================== */
import { WEEKS, pagesOf } from './weeks.js';

/* ───────────────────────── Barre des rectangles ───────────────────── */
const bar = document.createElement('nav');
bar.id = 'week-bar';
bar.setAttribute('aria-label', 'Newsletters by week');

for (const week of WEEKS) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'week-tile';
  tile.innerHTML =
    `<span class="week-n">Week ${week.n}</span>` +
    (week.dates ? `<span class="week-dates">${week.dates}</span>` : '');
  tile.addEventListener('click', () => openViewer(week));
  bar.appendChild(tile);
}

document.body.appendChild(bar);

/* ───────────────────────────── Lecteur ────────────────────────────── */
const viewer = document.createElement('div');
viewer.id = 'week-viewer';
viewer.innerHTML =
  `<button id="week-close" type="button" aria-label="Close">✕</button>` +
  `<div class="week-scroll"></div>`;
document.body.appendChild(viewer);

const scroll = viewer.querySelector('.week-scroll');

function openViewer(week) {
  // (Re)construit les pages à chaque ouverture, remet le scroll en haut.
  scroll.innerHTML = '';
  pagesOf(week).forEach((src, i) => {
    const img = document.createElement('img');
    img.className = 'week-page';
    img.src = src;
    img.alt = `Week ${week.n} — page ${i + 1}`;
    img.loading = i === 0 ? 'eager' : 'lazy';   // 1re page tout de suite, le reste à la demande
    scroll.appendChild(img);
  });
  viewer.classList.add('open');
  scroll.scrollTop = 0;
}

function closeViewer() {
  viewer.classList.remove('open');
  scroll.innerHTML = '';                         // libère les images en mémoire
}

viewer.querySelector('#week-close').addEventListener('click', closeViewer);
viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && viewer.classList.contains('open')) {
    e.stopPropagation();                         // ne pas laisser la 3D capter l'Échap
    closeViewer();
  }
});
