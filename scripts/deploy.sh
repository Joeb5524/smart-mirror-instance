#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[deploy] Pulling instance repo..."
git pull --rebase

echo "[deploy] Installing/updating modules..."
"$ROOT/scripts/install_modules.sh"

echo "[deploy] Linking config..."
"$ROOT/scripts/link_config.sh"

if [ ! -f "/etc/magicmirror.env" ]; then
  echo "[deploy] WARNING: /etc/magicmirror.env not found (Hue/env secrets may be missing)."
fi

echo "[deploy] Restarting MagicMirror..."
"$ROOT/scripts/restart_mm.sh"

echo "[deploy] Done."