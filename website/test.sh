#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Building Jekyll site..."
bundle exec jekyll build

echo "Starting server..."
npx serve _site -l 3000 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

echo "Waiting for server..."
for i in $(seq 1 30); do
  curl -sf http://localhost:3000 >/dev/null && break
  [[ $i -eq 30 ]] && { echo "Server failed to start"; exit 1; }
  sleep 0.5
done

npx playwright install --with-deps 2>/dev/null || true
echo "Running Playwright tests..."
npx playwright test
