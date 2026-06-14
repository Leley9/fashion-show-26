/* =====================================================================
   content.js — LE CONTENU DES MODALES   (fichier à éditer par l'équipe)
   =====================================================================

   ┌─────────────────────────────────────────────────────────────────┐
   │  COMMENT AJOUTER / MODIFIER UNE PHOTO OU UNE VIDÉO                │
   ├─────────────────────────────────────────────────────────────────┤
   │  1. Déposez vos fichiers bruts dans     assets/media/raw/         │
   │  2. Lancez la compression :             ./compress-media.sh       │
   │     -> les versions web arrivent dans   assets/media/             │
   │  3. Ajoutez le chemin dans la bonne modale ci-dessous :           │
   │        images : [ 'assets/media/ma-photo.webp' ]                  │
   │        videos : [ 'assets/media/ma-video.mp4' ]                   │
   │           (ou un lien YouTube/Vimeo : 'https://youtube.com/embed/…')│
   │                                                                   │
   │  • Plusieurs médias = on les sépare par des virgules.             │
   │  • images: [] ET videos: [] vides  ->  "Contenu à venir".         │
   │  • Le reste (title, note, position, color) : ne touchez que si    │
   │    vous voulez changer le texte ou l'emplacement de la bulle.     │
   └─────────────────────────────────────────────────────────────────┘
   ===================================================================== */

export const HOTSPOTS = [

  /* ════════════════════════════════ MODALE : INTRO ═══════════════════ */
  {
    id: 'intro',
    title: 'DDW 26 — Défilé',
    position: [2.0, 1.5, 4.6],
    color: '#ff5fae',
    note:
      "Bienvenue dans notre espace.\n\n" +
      "Un jardin-lounge coloré et accueillant : street wear technique, " +
      "teintures végétales, seconde main, et l'idée d'écosystèmes qui " +
      "nourrissent plutôt qu'ils ne détruisent.\n\n" +
      "Baladez-vous : chaque bulle ouvre une partie de notre travail.",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : BOUTIQUE ════════════════ */
  {
    id: 'shop',
    title: 'La boutique — les pièces',
    position: [16.6, 1.3, 2.2],          // près du Clothes Hanger Cabinet
    color: '#7b5cff',
    note:
      "Les 7 looks et accessoires.\n\n" +
      "Costume revisité (la veste à spikes dans le dos), pièces techniques " +
      "à zips, rubans, et la joaillerie de Becky.\n\n" +
      "(Ajoutez ici les photos des portants et des pièces finies.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],                          // ex : ['assets/media/look-01.webp']
    videos: [],
  },

  /* ════════════════════════════════ MODALE : ASSISES ════════════════ */
  {
    id: 'seating',
    title: 'Les assises — le concept',
    position: [6.5, 1.1, 0.9],           // près du Round Pillow
    color: '#00d6c2',
    note:
      "Un espace public inclusif, pensé pour la rencontre.\n\n" +
      "La performance s'approche d'une danse : chanson douce, mouvements " +
      "lents, solos, trios, tous ensemble.\n\n" +
      "(Notes d'intention, croquis d'ambiance, plan de la scéno.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : TEINTURE ═══════════════ */
  {
    id: 'dyeing',
    title: 'Teinture végétale & fleurs',
    position: [1.0, 1.4, 8.6],           // près du polstar, angle jardin
    color: '#ffd23f',
    note:
      "Les nuances colorées viennent des plantes.\n\n" +
      "Marc fait pousser des betteraves et des fleurs en Normandie pour " +
      "teindre nos textiles — couleurs vives et joyeuses.\n\n" +
      "(Photos du champ, des bains de teinture, des échantillons.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : PROCESSUS ══════════════ */
  {
    id: 'process',
    title: 'Le processus — atelier',
    position: [9.0, 1.3, 4.5],           // centre de l'espace
    color: '#ff7847',
    note:
      "Couture, patronage, sourcing textile : tout est documenté.\n\n" +
      "Rens filme et photographie l'avancée. Un petit film sera disponible " +
      "pendant la communication.\n\n" +
      "Déposez ici vos photos/vidéos d'atelier au fil des mois.",

    // ───── MÉDIAS (photos studio compressées) ─────
    images: [
      'assets/media/studio-01.webp',     // In The Stu
      'assets/media/studio-02.webp',     // IMG_5745
      'assets/media/space-render.webp',  // rendu Blender de l'espace
    ],
    videos: [],                          // ex : ['assets/media/atelier.mp4']
  },

];
