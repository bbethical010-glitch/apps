#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$ROOT_DIR/cloudflare/quick-tunnel.log"
PROD_ENV="$ROOT_DIR/client/.env.production"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "Missing $LOG_FILE. Start the quick tunnel first."
  exit 1
fi

TUNNEL_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_FILE" | tail -n 1)"

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Could not find a trycloudflare.com URL in $LOG_FILE."
  exit 1
fi

cat > "$PROD_ENV" <<EOF
VITE_API_BASE_URL=$TUNNEL_URL
VITE_STATUS_POLL_MS=5000
VITE_APP_BASE_PATH=/apps/
EOF

echo "Using quick tunnel URL: $TUNNEL_URL"

cd "$ROOT_DIR"
npm run deploy:pages-root
