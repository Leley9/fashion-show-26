# DDW 26 — The Purple Show

Site 3D interactif de candidature à la **Dutch Design Week 2026** (défilé de mode).
Une scène 3D explorable où l'on navigue dans l'espace du show et où des bulles
ouvrent des modales présentant notre travail (photos, vidéos, intentions).

Construit en **Three.js** (vanilla, sans build), éclairé par une **HDRI procédurale**
générée au bruit de Perlin, à partir d'un modèle **Blender** compressé en GLB/Draco.

---

## 🚀 Lancer le site en local

Le site a besoin d'un petit serveur (les modules ES + le GLB ne marchent pas en `file://`) :

```bash
python3 -m http.server 8080
# puis ouvrir  http://localhost:8080/show.html
```

### Navigation
- **Mode Orbite** (par défaut, type Blender) : souris pour pivoter, molette pour zoomer,
  **pavé numérique** `1/3/7` (vues), `4/6/8/2` (pivoter), `+/−` (zoom), `0` (recadrer), `5` (aplatir).
- **Mode Vol** (`Tab` ou bouton) : `WASD/ZQSD` pour voler, `Espace/Maj` haut-bas, souris pour regarder.
- Viser une **bulle** colorée et cliquer → ouvre la modale de contenu.

---

## 📁 Structure

| Chemin | Rôle |
|---|---|
| `show.html` | page du site (UI + import Three.js) |
| `scene.js` | scène 3D : chargement, navigation, HDRI, bulles cliquables |
| `hdri.js` | environnement irisé procédural (bruit de Perlin) |
| `content.js` | **contenu des modales** (textes, photos, vidéos) — à éditer |
| `main.css` | UI glassmorphism |
| `3D/space.glb` | modèle 3D compressé (Draco + WebP) |
| `assets/media/` | médias optimisés pour le web |
| `pipeline/` | mise à jour auto du modèle depuis Blender |
| `compress-media.sh` | compression des photos/vidéos/audio |
| `save.sh` | sauvegarde + push GitHub en une commande |
| `water-demo.html` | playground d'apprentissage (eau Perlin) |

---

## ✏️ Ajouter / modifier une photo ou vidéo

1. Déposer les fichiers bruts dans `assets/media/raw/`
2. Lancer la compression :
   ```bash
   ./compress-media.sh
   ```
   → versions web (WebP / MP4 / MP3) dans `assets/media/`
3. Référencer le chemin dans la bonne modale de `content.js` :
   ```js
   images: [ 'assets/media/ma-photo.webp' ],
   videos: [ 'assets/media/ma-video.mp4' ],
   ```

---

## 🔄 Mettre à jour le modèle 3D depuis Blender

Le modèle vient de `~/Desktop/FashionShow26.blend`.

- **Ponctuel** (après avoir enregistré dans Blender) :
  ```bash
  ./pipeline/update-model.sh
  ```
- **Automatique** (ré-export + compression à chaque sauvegarde Blender) :
  ```bash
  ./pipeline/watch-model.sh
  ```

Le pipeline exporte la scène (Blender headless) puis la compresse
(Draco + textures WebP) vers `3D/space.glb`.

---

## 💾 Sauvegarder la progression

```bash
./save.sh "ce que j'ai changé"
```
(commit + push automatiques)

---

## 🛠️ Outils requis

- [Python 3](https://www.python.org/) — serveur local
- [Blender 4.x](https://www.blender.org/) — pipeline modèle 3D
- `ffmpeg`, `cwebp`, Node.js (`npx`) — compression médias/modèle
  ```bash
  brew install ffmpeg webp node
  ```

---

_Les notes de production sont dans [`MEETING_NOTES.md`](MEETING_NOTES.md)._
