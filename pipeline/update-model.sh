#!/usr/bin/env bash
# =====================================================================
#  update-model.sh — Blender (.blend)  ->  GLB exporté  ->  GLB compressé
# ---------------------------------------------------------------------
#  Exporte la scène Blender puis la compresse (Draco + textures WebP)
#  et remplace  3D/space.glb  utilisé par le site.
#
#  Usage :  ./pipeline/update-model.sh  [chemin/vers/fichier.blend]
#  (sans argument -> ~/Desktop/FashionShow26.blend)
# =====================================================================
set -uo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
BLEND="${1:-$HOME/Desktop/FashionShow26.blend}"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
OUT="$PROJECT/3D/space.glb"
TMP="$(mktemp -t ddwglb).glb"

[ -f "$BLEND" ]    || { echo "❌ .blend introuvable : $BLEND"; exit 1; }
[ -x "$BLENDER" ]  || { echo "❌ Blender introuvable : $BLENDER"; exit 1; }

echo "🟦 1/2  Export Blender → GLB…"
"$BLENDER" -b "$BLEND" --python "$PROJECT/pipeline/export_glb.py" -- "$TMP" \
  >/tmp/ddw_blender.log 2>&1 \
  || { echo "❌ Export Blender échoué (voir /tmp/ddw_blender.log)"; tail -5 /tmp/ddw_blender.log; exit 1; }

raw=$(du -h "$TMP" | cut -f1)
echo "    GLB brut : $raw"

echo "🟪 2/2  Compression (Draco + WebP)…"
npx --yes @gltf-transform/cli@latest optimize "$TMP" "$OUT" \
  --compress draco --texture-compress webp --texture-size 2048 \
  >/tmp/ddw_gltf.log 2>&1 \
  || { echo "❌ Compression échouée (voir /tmp/ddw_gltf.log)"; tail -5 /tmp/ddw_gltf.log; exit 1; }

rm -f "$TMP"
final=$(du -h "$OUT" | cut -f1)
echo "✅ Modèle mis à jour : 3D/space.glb  ($raw → $final)"
echo "   Rechargez le site pour voir les changements."
