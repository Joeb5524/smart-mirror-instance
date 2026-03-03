#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MM_DIR="${MM_DIR:-$HOME/MagicMirror}"

SRC="$ROOT/config/config.js"
DEST="$MM_DIR/config/config.js"

if [ ! -f "$SRC" ]; then
  echo "[link_config] ERROR: Missing $SRC"
  exit 1
fi

mkdir -p "$(dirname "$DEST")"

# If already linked correctly, do nothing
if [ -L "$DEST" ] && [ "$(readlink -f "$DEST")" = "$SRC" ]; then
  echo "[link_config] Config already linked: $DEST -> $SRC"
  exit 0
fi

# Backup any existing real file
if [ -e "$DEST" ] && [ ! -L "$DEST" ]; then
  backup="${DEST}.bak.$(date +%Y%m%d-%H%M%S)"
  echo "[link_config] Backing up existing config to: $backup"
  cp "$DEST" "$backup"
fi

echo "[link_config] Linking: $DEST -> $SRC"
ln -sfn "$SRC" "$DEST"
echo "[link_config] Done."