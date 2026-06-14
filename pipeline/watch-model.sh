#!/usr/bin/env bash
# =====================================================================
#  watch-model.sh — surveille le .blend et met à jour le site à chaque save
# ---------------------------------------------------------------------
#  Lancez-le une fois, laissez-le tourner dans un terminal :
#      ./pipeline/watch-model.sh
#  À chaque fois que vous enregistrez FashionShow26.blend dans Blender,
#  le GLB du site est ré-exporté + recompressé automatiquement.
#  (Ctrl+C pour arrêter.)
# =====================================================================
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BLEND="${1:-$HOME/Desktop/FashionShow26.blend}"
UPDATE="$DIR/update-model.sh"

[ -f "$BLEND" ] || { echo "❌ .blend introuvable : $BLEND"; exit 1; }

echo "👀 Surveillance de : $BLEND"
echo "   (enregistrez dans Blender pour déclencher la mise à jour · Ctrl+C pour arrêter)"
echo ""

run() {
  echo "── $(date '+%H:%M:%S')  changement détecté → mise à jour…"
  "$UPDATE" "$BLEND"
  echo ""
}

if command -v fswatch >/dev/null 2>&1; then
  # Méthode efficace (brew install fswatch)
  fswatch -o "$BLEND" | while read -r _; do
    sleep 1            # laisse Blender finir d'écrire le fichier
    run
  done
else
  # Repli sans dépendance : on compare la date de modif toutes les 2 s
  echo "ℹ️  (astuce : 'brew install fswatch' pour une détection instantanée)"
  last="$(stat -f %m "$BLEND")"
  while true; do
    sleep 2
    cur="$(stat -f %m "$BLEND")"
    if [ "$cur" != "$last" ]; then
      last="$cur"
      sleep 1
      run
    fi
  done
fi
