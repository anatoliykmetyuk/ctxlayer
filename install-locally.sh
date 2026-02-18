#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Uninstalling previously installed ctx..."
npm uninstall -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g ctx 2>/dev/null || true

echo "Removing previously installed skill..."
rm -rf ~/.agents/skills/ctxlayer 2>/dev/null || true
rm -rf ~/.cursor/skills/ctxlayer 2>/dev/null || true

echo "Installing ctx from local source..."
npm install
npm link

echo "Installing skill from local source..."
npx skills add "$SCRIPT_DIR" -g -a cursor --skill ctxlayer -y

echo "Done! ctx and the ctxlayer skill are available. Edits to bin/cli.js and skills/ take effect after re-running this script."
