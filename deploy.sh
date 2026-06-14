#!/usr/bin/env bash
# =====================================================================
#  deploy.sh — met le site en ligne sur Cloudflare Pages (projet ddw26)
#  Usage :  ./deploy.sh
#
#  ⚠️ SÉCURITÉ : Cloudflare Pages publie TOUT le dossier, y compris les
#  dotfiles (.dev.vars, .env…). On écarte donc TEMPORAIREMENT les fichiers
#  sensibles + lourds avant l'upload, puis on les remet en place (trap).
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

export CI=1                          # wrangler non-interactif
WRANGLER="npx -y wrangler@4.100.0"   # version figée

# Tout ce qui ne doit JAMAIS être publié.
SECRET_FILES=(.env .env.example .dev.vars .dev.vars.example .dev.vars.staging)

HOLD="$(mktemp -d)"
restore() {
  [ -e "$HOLD/node_modules" ] && mv "$HOLD/node_modules" ./ || true
  [ -e "$HOLD/newsletter" ]   && mv "$HOLD/newsletter" ./   || true
  [ -e "$HOLD/FashionShow26SpaceDraft.glb" ] && mv "$HOLD/FashionShow26SpaceDraft.glb" 3D/ || true
  for f in "${SECRET_FILES[@]}"; do [ -e "$HOLD/$f" ] && mv "$HOLD/$f" ./ || true; done
  rmdir "$HOLD" 2>/dev/null || true
}
trap restore EXIT   # remet tout en place même en cas d'erreur / Ctrl+C

# 1) écarte secrets + code du sender + deps + sources lourdes
for f in "${SECRET_FILES[@]}"; do [ -e "$f" ] && mv "$f" "$HOLD/" || true; done
[ -d node_modules ] && mv node_modules "$HOLD/"
[ -d newsletter ]   && mv newsletter "$HOLD/"
[ -f 3D/FashionShow26SpaceDraft.glb ] && mv 3D/FashionShow26SpaceDraft.glb "$HOLD/"

# 2) déploie le dossier nettoyé
$WRANGLER pages deploy . --project-name=ddw26 --commit-dirty=true --branch=main

echo "✅ En ligne : https://ddw26.pages.dev"
