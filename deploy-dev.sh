#!/usr/bin/env bash
# =====================================================================
#  deploy-dev.sh — APERÇU LOCAL (rien n'est mis en ligne)
#  Sert le site sur ta machine via "wrangler pages dev" : pages statiques
#  + fonctions newsletter, avec un KV LOCAL (tes tests ne touchent aucune
#  vraie base). Contrairement à deploy.sh / deploy-staging.sh, on ne
#  déplace PAS le GLB ni node_modules : en local la scène 3D en a besoin.
#  Accessible aussi depuis un mobile sur le MÊME WiFi : on écoute sur
#  0.0.0.0 et on affiche l'URL réseau à ouvrir sur le téléphone.
#  Usage :  ./deploy-dev.sh            (Ctrl+C pour arrêter)
#           ./deploy-dev.sh 3000       (port au choix, défaut 8788)
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

# Version de wrangler figée + non-interactif (mêmes garde-fous que les
# autres scripts : évite la v4 qui pose des questions / la fenêtre skills).
export CI=1
WRANGLER="npx -y wrangler@4.100.0"

PORT="${1:-8788}"

# IP locale sur le réseau WiFi (macOS : route par défaut -> interface active).
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '')"

echo "▶ Aperçu local      : http://localhost:$PORT"
if [ -n "$LAN_IP" ]; then
  echo "▶ Depuis ton mobile : http://$LAN_IP:$PORT   (même WiFi)"
else
  echo "▶ Mobile : IP réseau introuvable — vérifie que le WiFi est actif."
fi
echo "  (Ctrl+C pour arrêter)"

# --ip 0.0.0.0 : écoute sur toutes les interfaces (sinon le mobile ne peut
# pas joindre la machine, seul localhost répondrait).
$WRANGLER pages dev . --kv NEWSLETTER --ip 0.0.0.0 --port "$PORT"
