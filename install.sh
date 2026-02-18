#!/usr/bin/env bash
set -e

if ! command -v npm &> /dev/null; then
  echo "Error: npm is required but not installed. Install Node.js from https://nodejs.org"
  exit 1
fi

VERSION=$(npm view @anatoliikmt/ctxlayer version)
echo "Installing ctxlayer v${VERSION}..."
npm install -g @anatoliikmt/ctxlayer@${VERSION}
npx skills add https://github.com/anatoliykmetyuk/ctxlayer/tree/v${VERSION} -g --skill ctxlayer
echo "Done! Run 'ctx' to get started."
