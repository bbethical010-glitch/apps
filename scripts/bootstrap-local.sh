#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STORAGE_ROOT="/Volumes/My SSD/MyCloudStorage"
SERVER_ENV="$ROOT_DIR/server/.env"
CLIENT_ENV="$ROOT_DIR/client/.env"

mkdir -p "$STORAGE_ROOT"

cat > "$SERVER_ENV" <<EOF
PORT=8787
STORAGE_ROOT=$STORAGE_ROOT
CORS_ORIGIN=http://localhost:5173,https://bbethical010-glitch.github.io
POLL_INTERVAL_MS=5000
EOF

cat > "$CLIENT_ENV" <<EOF
VITE_API_BASE_URL=http://localhost:8787
VITE_STATUS_POLL_MS=5000
VITE_APP_BASE_PATH=/
EOF

echo "Prepared local SSD Cloud Storage config."
echo "Storage root: $STORAGE_ROOT"
echo "Server env: $SERVER_ENV"
echo "Client env: $CLIENT_ENV"
echo "Production frontend config still needs your Cloudflare Tunnel hostname."
