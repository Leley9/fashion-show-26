#!/usr/bin/env bash
# =====================================================================
#  deploy-staging.sh — déploie sur l'environnement de TEST
#  -> projet Pages "ddw26-staging" · URL https://ddw26-staging.pages.dev
#  Base KV + secrets séparés de la prod : tes tests ne polluent jamais
#  la vraie liste d'abonnés.
#  Usage :  ./deploy-staging.sh
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

STAGING_KV="$(grep '^STAGING_KV_ID=' .dev.vars.staging | cut -d= -f2)"
[ -z "$STAGING_KV" ] && { echo "✗ STAGING_KV_ID introuvable dans .dev.vars.staging"; exit 1; }

HOLD="$(mktemp -d)"
restore() {
  [ -f wrangler.toml.bak ] && mv wrangler.toml.bak wrangler.toml || true
  [ -e "$HOLD/node_modules" ] && mv "$HOLD/node_modules" ./ 2>/dev/null || true
  [ -e "$HOLD/FashionShow26SpaceDraft.glb" ] && mv "$HOLD/FashionShow26SpaceDraft.glb" 3D/ 2>/dev/null || true
  rmdir "$HOLD" 2>/dev/null || true
}
trap restore EXIT   # restaure la config + les fichiers même en cas d'erreur

# 1) écarte les gros fichiers inutiles comme assets
[ -d node_modules ] && mv node_modules "$HOLD/"
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
npx wrangler pages deploy . --project-name=ddw26-staging --commit-dirty=true --branch=main

echo "✅ Staging en ligne : https://ddw26-staging.pages.dev"
