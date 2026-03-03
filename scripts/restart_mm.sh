#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-magicmirror}"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[restart_mm] ERROR: pm2 not found."
  exit 1
fi

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "[restart_mm] Restarting pm2 app: $APP_NAME"
  pm2 restart "$APP_NAME" --update-env
  exit 0
fi

# Try to find an existing MM process by cwd/exec path
FOUND="$(pm2 jlist | node - <<'NODE'
const fs = require("fs");
const list = JSON.parse(fs.readFileSync(0,"utf8"));
const mm = list.find(p => {
  const e = p.pm2_env || {};
  return (e.cwd && e.cwd.includes("MagicMirror")) ||
         (e.pm_exec_path && e.pm_exec_path.includes("MagicMirror"));
});
if (mm && mm.name) process.stdout.write(mm.name);
NODE
)"

if [ -n "$FOUND" ]; then
  echo "[restart_mm] Found existing MM pm2 process: $FOUND"
  pm2 restart "$FOUND" --update-env
  exit 0
fi

echo "[restart_mm] No existing pm2 process found. Starting from ecosystem.config.cjs..."
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pm2 start "$ROOT/ecosystem.config.cjs" --update-env
pm2 save