#!/usr/bin/env bash
# =====================================================================
#  deploy-staging.sh — déploie sur l'environnement de TEST
#  -> projet Pages "ddw26-staging" · URL https://ddw26-staging.pages.dev
#  Base KV + secrets séparés de la prod.
#
#  ⚠️ SÉCURITÉ : on écarte les fichiers sensibles avant l'upload (cf deploy.sh).
#  Usage :  ./deploy-staging.sh
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

export CI=1
WRANGLER="npx -y wrangler@4.100.0"

# Lis l'id KV staging AVANT de déplacer les fichiers de secrets.
STAGING_KV="$(grep '^STAGING_KV_ID=' .dev.vars.staging | cut -d= -f2)"
[ -z "$STAGING_KV" ] && { echo "✗ STAGING_KV_ID introuvable dans .dev.vars.staging"; exit 1; }

SECRET_FILES=(.env .env.example .dev.vars .dev.vars.example .dev.vars.staging)

HOLD="$(mktemp -d)"
restore() {
  [ -f wrangler.toml.bak ] && mv wrangler.toml.bak wrangler.toml || true
  [ -e "$HOLD/node_modules" ] && mv "$HOLD/node_modules" ./ || true
  [ -e "$HOLD/newsletter" ]   && mv "$HOLD/newsletter" ./   || true
  [ -e "$HOLD/FashionShow26SpaceDraft.glb" ] && mv "$HOLD/FashionShow26SpaceDraft.glb" 3D/ || true
  for f in "${SECRET_FILES[@]}"; do [ -e "$HOLD/$f" ] && mv "$HOLD/$f" ./ || true; done
  rmdir "$HOLD" 2>/dev/null || true
}
trap restore EXIT

# 1) écarte secrets + sender + deps + sources lourdes
for f in "${SECRET_FILES[@]}"; do [ -e "$f" ] && mv "$f" "$HOLD/" || true; done
[ -d node_modules ] && mv node_modules "$HOLD/"
[ -d newsletter ]   && mv newsletter "$HOLD/"
[ -f 3D/FashionShow26SpaceDraft.glb ] && mv 3D/FashionShow26SpaceDraft.glb "$HOLD/"

# 2) config temporaire pointant la base KV de staging
cp wrangler.toml wrangler.toml.bak
cat > wrangler.toml <<EOF
name = "ddw26-staging"
compatibility_date = "2024-11-01"
pages_build_output_dir = "."

[[kv_namespaces]]
binding = "NEWSLETTER"
id = "$STAGING_KV"
EOF

# 3) déploie
$WRANGLER pages deploy . --project-name=ddw26-staging --commit-dirty=true --branch=main

echo "✅ Staging en ligne : https://ddw26-staging.pages.dev"
