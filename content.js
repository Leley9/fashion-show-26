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
    title: 'DDW 26 — Fashion Show',
    position: [2.0, 1.5, 4.6],
    color: '#ff5fae',
    note:
      "Welcome to our space.\n\n" +
      "A colourful, welcoming garden-lounge: technical streetwear, " +
      "plant-based dyes, second-hand pieces, and the idea of ecosystems that " +
      "nourish rather than destroy.\n\n" +
      "Wander around: each bubble opens a part of our work.",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : BOUTIQUE ════════════════ */
  {
    id: 'shop',
    title: 'The shop — the pieces',
    position: [16.6, 1.3, 2.2],          // près du Clothes Hanger Cabinet
    color: '#7b5cff',
    note:
      "The 7 looks and accessories.\n\n" +
      "A reimagined suit (the spiked jacket on the back), technical pieces " +
      "with zips, ribbons, and Becky's jewellery.\n\n" +
      "(Add here the photos of the racks and the finished pieces.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],                          // ex : ['assets/media/look-01.webp']
    videos: [],
  },

  /* ════════════════════════════════ MODALE : ASSISES ════════════════ */
  {
    id: 'seating',
    title: 'The seating — the concept',
    position: [6.5, 1.1, 0.9],           // près du Round Pillow
    color: '#00d6c2',
    note:
      "An inclusive public space, designed for encounters.\n\n" +
      "The performance comes close to a dance: gentle song, slow " +
      "movements, solos, trios, all together.\n\n" +
      "(Intention notes, mood sketches, set design plan.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : TEINTURE ═══════════════ */
  {
    id: 'dyeing',
    title: 'Plant dyeing & flowers',
    position: [1.0, 1.4, 8.6],           // près du polstar, angle jardin
    color: '#ffd23f',
    note:
      "The colourful shades come from plants.\n\n" +
      "Marc grows flowers in Normandy — using them to " +
      "dye our textiles and create bright, joyful colours? What other alternatives?\n\n" +
      "(Photos of the field, the dye baths, the samples.)",

    // ───── MÉDIAS (ajoutez vos fichiers ici) ─────
    images: [],
    videos: [],
  },

  /* ════════════════════════════════ MODALE : PROCESSUS ══════════════ */
  {
    id: 'process',
    title: 'The process — studio',
    position: [9.0, 1.3, 4.5],           // centre de l'espace
    color: '#ff7847',
    note:
      "Sewing, pattern-making, textile sourcing: everything is documented.\n\n" +
      "Rens films and photographs the progress. A short film will be available " +
      "during the communication.\n\n" +
      "Drop your studio photos/videos here over the months.",

    // ───── MÉDIAS (photos studio compressées) ─────
    images: [
      'assets/media/studio-01.webp',     // In The Stu
      'assets/media/studio-02.webp',     // IMG_5745
      'assets/media/space-render.webp',  // rendu Blender de l'espace
    ],
    videos: [],                          // ex : ['assets/media/atelier.mp4']
  },

];
