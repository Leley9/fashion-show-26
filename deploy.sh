#!/usr/bin/env bash
# =====================================================================
#  deploy.sh — met le site en ligne sur Cloudflare Pages (projet ddw26)
#  Usage :  ./deploy.sh
#  Écarte temporairement node_modules + le GLB source (trop gros / inutiles
#  comme assets statiques), déploie, puis remet tout en place.
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

HOLD="$(mktemp -d)"
restore() {
  [ -e "$HOLD/node_modules" ] && mv "$HOLD/node_modules" ./ 2>/dev/null || true
  [ -e "$HOLD/FashionShow26SpaceDraft.glb" ] && mv "$HOLD/FashionShow26SpaceDraft.glb" 3D/ 2>/dev/null || true
  rmdir "$HOLD" 2>/dev/null || true
}
trap restore EXIT   # remet tout en place même en cas d'erreur

[ -d node_modules ] && mv node_modules "$HOLD/"
[ -f 3D/FashionShow26SpaceDraft.glb ] && mv 3D/FashionShow26SpaceDraft.glb "$HOLD/"

npx wrangler pages deploy . --project-name=ddw26 --commit-dirty=true --branch=main

echo "✅ En ligne : https://ddw26.pages.dev"
