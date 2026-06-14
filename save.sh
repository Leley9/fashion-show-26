#!/usr/bin/env bash
# =====================================================================
#  save.sh — sauvegarde la progression sur GitHub en UNE commande
# ---------------------------------------------------------------------
#  Usage :
#     ./save.sh                  -> commit auto daté + push
#     ./save.sh "mon message"    -> commit avec ton message + push
# =====================================================================
set -uo pipefail
cd "$(dirname "$0")"

MSG="${*:-Mise à jour $(date '+%Y-%m-%d %H:%M')}"

git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Rien à sauvegarder (aucun changement)."
  exit 0
fi

git commit -m "$MSG"
git push
echo "✅ Progression sauvegardée et poussée sur GitHub."
