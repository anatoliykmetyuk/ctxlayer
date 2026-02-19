#!/usr/bin/env bash
set -e

echo "Uninstalling ctx CLI..."
npm uninstall -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g @anatoliikmt/ctxlayer 2>/dev/null || true
npm unlink -g ctx 2>/dev/null || true

echo "Removing ctxlayer agent skill..."
npx skills remove ctxlayer -g --agent '*' -y 2>/dev/null || true

echo "Done. ctx and the ctxlayer skill have been removed."
