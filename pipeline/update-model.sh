#!/usr/bin/env bash
# =====================================================================
#  update-model.sh — Blender (.blend)  ->  GLB exporté  ->  GLB compressé
# ---------------------------------------------------------------------
#  Exporte la scène Blender UNE fois puis la compresse en DEUX variantes,
#  à partir du même export brut (donc géométrie identique) :
#    • 3D/space.glb         desktop (textures WebP 2048)
#    • 3D/space-mobile.glb  mobile  (textures WebP 1024, ~3-4x plus léger)
#  Écrit aussi 3D/space.manifest.json (tailles exactes) pour la barre de
#  chargement. Le site choisit la variante selon l'appareil (cf. scene.js).
#
#  Usage :  ./pipeline/update-model.sh  [chemin/vers/fichier.blend]
#  (sans argument -> ~/Desktop/FashionShow26.blend)
# =====================================================================
set -uo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
BLEND="${1:-$HOME/Desktop/FashionShow26.blend}"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
OUT="$PROJECT/3D/space.glb"                 # variante desktop (textures 2048)
OUT_MOBILE="$PROJECT/3D/space-mobile.glb"   # variante mobile  (textures 1024)
MANIFEST="$PROJECT/3D/space.manifest.json"  # tailles exactes -> barre fluide
TMP="$(mktemp -t ddwglb).glb"

[ -f "$BLEND" ]    || { echo ".blend introuvable : $BLEND"; exit 1; }
[ -x "$BLENDER" ]  || { echo "Blender introuvable : $BLENDER"; exit 1; }

echo "1/3  Export Blender → GLB…"
"$BLENDER" -b "$BLEND" --python "$PROJECT/pipeline/export_glb.py" -- "$TMP" \
  >/tmp/ddw_blender.log 2>&1 \
  || { echo "Export Blender échoué (voir /tmp/ddw_blender.log)"; tail -5 /tmp/ddw_blender.log; exit 1; }

raw=$(du -h "$TMP" | cut -f1)
echo "    GLB brut : $raw"

# La normal map du sol (Soil_2K_Normal) est très haute fréquence : en 2048 elle
# pèse ~2,2 Mo en WebP (vs <0,3 Mo pour les autres normal maps) -> ~20% du GLB
# desktop, pour un sol vu surtout de loin. On la plafonne à 1024 SUR LE BRUT,
# AVANT la compression, pour que Draco/WebP s'appliquent ensuite normalement.
# `resize` ne fait que réduire (jamais agrandir) et ne touche QUE la texture
# ciblée -> sans effet sur la variante mobile (déjà en 1024). -1,x Mo desktop,
# quasi invisible à l'œil.
echo "    Allègement : Soil_2K_Normal → 1024…"
TMP_R="$(mktemp -t ddwglbr).glb"
npx --yes @gltf-transform/cli@latest resize "$TMP" "$TMP_R" \
  --pattern "*Soil*Normal*" --width 1024 --height 1024 \
  >/tmp/ddw_resize.log 2>&1 \
  || { echo "Resize sol échoué (voir /tmp/ddw_resize.log)"; tail -5 /tmp/ddw_resize.log; exit 1; }
mv "$TMP_R" "$TMP"

# Compresse le MÊME export brut ($TMP) vers $2, à la taille de texture $1
# (Draco + WebP). Les deux variantes partagent donc exactement la géométrie.
compress() {
  local size="$1" dst="$2"
  npx --yes @gltf-transform/cli@latest optimize "$TMP" "$dst" \
    --compress draco --texture-compress webp --texture-size "$size" \
    >/tmp/ddw_gltf.log 2>&1 \
    || { echo "Compression échouée (voir /tmp/ddw_gltf.log)"; tail -5 /tmp/ddw_gltf.log; exit 1; }
}

echo "2/3  Compression desktop (Draco + WebP 2048)…"
compress 2048 "$OUT"

echo "3/3  Compression mobile (Draco + WebP 1024)…"
compress 1024 "$OUT_MOBILE"

rm -f "$TMP"

# Manifeste lu par scene.js : tailles exactes en octets -> la barre suit le
# vrai téléchargement sans constante codée en dur dans le JS.
db=$(stat -f %z "$OUT"); mb=$(stat -f %z "$OUT_MOBILE")
printf '{ "desktop": %s, "mobile": %s }\n' "$db" "$mb" > "$MANIFEST"

echo "Modèles mis à jour ($raw brut) :"
echo "   • 3D/space.glb         desktop → $(du -h "$OUT" | cut -f1)"
echo "   • 3D/space-mobile.glb  mobile  → $(du -h "$OUT_MOBILE" | cut -f1)"
echo "   Rechargez le site pour voir les changements."
