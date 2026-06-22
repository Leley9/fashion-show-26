/* =====================================================================
   weeks.js — LES NEWSLETTERS HEBDO   (le SEUL fichier à éditer)
   =====================================================================

   ┌─────────────────────────────────────────────────────────────────┐
   │  COMMENT AJOUTER UNE SEMAINE                                      │
   ├─────────────────────────────────────────────────────────────────┤
   │  1. Exporte tes pages Canva en PNG, convertis-les en WebP.        │
   │  2. Dépose-les dans   assets/newsletter/week-02/                  │
   │     nommées dans l'ORDRE DE LECTURE :  1.webp, 2.webp, 3.webp...  │
   │     (1 = la couverture, le dernier = la page de fin)              │
   │  3. Ajoute UN objet ci-dessous. C'est tout — le rectangle et le   │
   │     lecteur apparaissent tout seuls.                              │
   └─────────────────────────────────────────────────────────────────┘

   Champs d'une semaine :
     n      → numéro de la semaine (sert au libellé "Week n")
     dates  → période affichée en petit sous le titre (optionnel)
     dir    → dossier des pages WebP
     pages  → nombre de pages (les fichiers 1.webp … N.webp)
   ===================================================================== */

export const WEEKS = [

  /* ════════════════════════════════ WEEK 1 ═══════════════════════════ */
  {
    n: 1,
    dates: '8–15 June',
    dir: 'assets/newsletter/week-01',
    pages: 4,
  },

  // ── Semaines suivantes : décommente et adapte ──
  // {
  //   n: 2,
  //   dates: '16–22 June',
  //   dir: 'assets/newsletter/week-02',
  //   pages: 4,
  // },

];

/* Construit la liste ordonnée des URLs de pages d'une semaine.
   week-01 + 4 pages  ->  ['assets/newsletter/week-01/1.webp', … '/4.webp'] */
export function pagesOf(week) {
  return Array.from({ length: week.pages }, (_, i) => `${week.dir}/${i + 1}.webp`);
}
