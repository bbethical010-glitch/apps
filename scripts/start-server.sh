#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$ROOT_DIR/server/.env" ]]; then
  echo "Missing server/.env. Run ./scripts/bootstrap-local.sh first."
  exit 1
fi

cd "$ROOT_DIR"
npm run dev:server
