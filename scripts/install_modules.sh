#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="${LOCK_FILE:-$ROOT/modules.lock.json}"
MM_DIR="${MM_DIR:-$HOME/MagicMirror}"
MOD_DIR="$MM_DIR/modules"

if [ ! -f "$LOCK_FILE" ]; then
  echo "[install_modules] ERROR: Missing $LOCK_FILE"
  exit 1
fi
if [ ! -d "$MM_DIR" ]; then
  echo "[install_modules] ERROR: MagicMirror dir not found at $MM_DIR"
  exit 1
fi

mkdir -p "$MOD_DIR"

mapfile -t MODULE_LINES < <(node - <<'NODE' "$LOCK_FILE"
const fs = require("fs");
const lockPath = process.argv[1];
const j = JSON.parse(fs.readFileSync(lockPath, "utf8"));
if (!Array.isArray(j.modules)) process.exit(2);
for (const m of j.modules) {
  if (!m || !m.name || !m.repo) continue;
  const ref = m.ref || "main";
  process.stdout.write(`${m.name}|${m.repo}|${ref}\n`);
}
NODE
)

echo "[install_modules] Target modules dir: $MOD_DIR"

for line in "${MODULE_LINES[@]}"; do
  IFS="|" read -r name repo ref <<<"$line"
  target="$MOD_DIR/$name"

  echo
  echo "[install_modules] === $name ($ref) ==="

  if [ -d "$target/.git" ]; then
    echo "[install_modules] Updating existing repo: $target"
    cd "$target"

    if [ -n "$(git status --porcelain)" ]; then
      echo "[install_modules] WARNING: Local changes detected in $name; skipping update to avoid conflicts."
      continue
    fi

    git remote set-url origin "$repo" >/dev/null 2>&1 || true
    git fetch --all --tags --prune
  else
    if [ -e "$target" ] && [ ! -d "$target/.git" ]; then
      echo "[install_modules] ERROR: $target exists but is not a git repo. Move it out of the way first."
      exit 1
    fi
    echo "[install_modules] Cloning: $repo -> $target"
    git clone "$repo" "$target"
    cd "$target"
    git fetch --all --tags --prune
  fi

  # Checkout ref robustly (branch/tag/commit)
  if git show-ref --verify --quiet "refs/tags/$ref"; then
    git checkout "tags/$ref"
  elif git show-ref --verify --quiet "refs/remotes/origin/$ref"; then
    git checkout -B "$ref" "origin/$ref"
  else
    git checkout "$ref"
  fi

  # Pull if on a branch
  if git symbolic-ref -q HEAD >/dev/null 2>&1; then
    git pull --ff-only || true
  fi

  # Install npm deps if needed
  if [ -f "package.json" ]; then
    echo "[install_modules] Installing npm deps for $name"
    if [ -f "package-lock.json" ]; then
      npm ci --omit=dev
    else
      npm install --omit=dev
    fi
  else
    echo "[install_modules] No package.json for $name (skipping npm install)"
  fi

  # Ensure runtime data dir exists (common pattern)
  mkdir -p data
done

echo
echo "[install_modules] Done."