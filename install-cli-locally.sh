#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Uninstalling previously installed ctx..."
npm uninstall -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g ctx 2>/dev/null || true

echo "Installing ctx from local source..."
npm install
npm link

echo "Done! ctx is available globally. Edits to bin/cli.js take effect immediately."
