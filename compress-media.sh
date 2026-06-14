#!/usr/bin/env bash
# =====================================================================
#  compress-media.sh — optimise vos médias pour le web (qualité conservée)
# ---------------------------------------------------------------------
#  USAGE :
#    1) Déposez vos fichiers bruts dans   assets/media/raw/
#    2) Lancez :  ./compress-media.sh
#    3) Les versions web optimisées arrivent dans  assets/media/
#    4) Référencez-les dans content.js
#
#  Outils : sips (macOS, intégré) + cwebp + ffmpeg
#           brew install webp ffmpeg
#
#  Réglages qualité (modifiables ci-dessous) :
#    - Photos  -> WebP qualité 82, max 1600 px (net mais léger ; repli JPEG)
#    - Vidéos  -> H.264 CRF 20, max 1080p, audio AAC 160k (très bonne qualité)
#    - Audio   -> MP3 192 kbps
# =====================================================================
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
RAW="$DIR/assets/media/raw"
OUT="$DIR/assets/media"

IMG_QUALITY=82
IMG_MAXEDGE=1600
VIDEO_CRF=20
VIDEO_MAXH=1080
AUDIO_BITRATE=192k

mkdir -p "$RAW" "$OUT"

have() { command -v "$1" >/dev/null 2>&1; }
have ffmpeg || { echo "❌ ffmpeg manquant : brew install ffmpeg"; exit 1; }

shopt -s nullglob 2>/dev/null || true
count=0

for f in "$RAW"/*; do
  [ -f "$f" ] || continue
  name="$(basename "$f")"
  stem="${name%.*}"
  ext_lc="$(echo "${name##*.}" | tr '[:upper:]' '[:lower:]')"

  case "$ext_lc" in
    jpg|jpeg|png|heic|heif|tif|tiff|webp)
      if have cwebp && have sips; then
        out="$OUT/$stem.webp"
        tmp="$(mktemp -t ddwimg).png"
        sips -s format png -Z "$IMG_MAXEDGE" "$f" --out "$tmp" >/dev/null 2>&1
        cwebp -quiet -q "$IMG_QUALITY" "$tmp" -o "$out"
        rm -f "$tmp"
        echo "🖼️  $name → $stem.webp"
      else
        out="$OUT/$stem.jpg"           # repli : JPEG (universel)
        sips -s format jpeg -s formatOptions "$IMG_QUALITY" -Z "$IMG_MAXEDGE" "$f" --out "$out" >/dev/null 2>&1
        echo "🖼️  $name → $stem.jpg (repli JPEG)"
      fi
      count=$((count+1))
      ;;
    mp4|mov|m4v|avi|mkv|webm)
      out="$OUT/$stem.mp4"
      ffmpeg -y -loglevel error -i "$f" \
        -vf "scale=-2:'min($VIDEO_MAXH,ih)'" \
        -c:v libx264 -preset slow -crf "$VIDEO_CRF" -pix_fmt yuv420p \
        -c:a aac -b:a 160k -movflags +faststart "$out"
      echo "🎬  $name → $stem.mp4"
      count=$((count+1))
      ;;
    wav|m4a|aac|flac|ogg|mp3)
      out="$OUT/$stem.mp3"
      ffmpeg -y -loglevel error -i "$f" -c:a libmp3lame -b:a "$AUDIO_BITRATE" "$out"
      echo "🎵  $name → $stem.mp3"
      count=$((count+1))
      ;;
    *)
      echo "⏭️  ignoré (format non géré) : $name"
      ;;
  esac
done

if [ "$count" -eq 0 ]; then
  echo "ℹ️  Rien à compresser. Déposez des fichiers dans : assets/media/raw/"
else
  echo "✅ $count fichier(s) optimisé(s) dans assets/media/"
fi
