#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/cloudflare"
LOG_FILE="$LOG_DIR/quick-tunnel.log"

mkdir -p "$LOG_DIR"

echo "Starting Cloudflare quick tunnel for http://localhost:8787"
echo "Log file: $LOG_FILE"
echo "When Cloudflare prints the trycloudflare.com URL, use it as VITE_API_BASE_URL for temporary testing."
echo "This script ignores ~/.cloudflared/config.yml so old ingress rules do not hijack the quick tunnel."

cloudflared tunnel \
  --config /dev/null \
  --url http://127.0.0.1:8787 \
  --logfile "$LOG_FILE" \
  --loglevel info
