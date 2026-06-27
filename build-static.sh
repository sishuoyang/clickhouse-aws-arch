#!/usr/bin/env bash
#
# build-static.sh — produce a self-contained static bundle of the app in dist/.
#
# Vite is configured with `base: './'`, so the output is fully relative and can be served from any
# host or subpath. This script additionally bundles the saved per-diagram layouts as
# `/__layout/<id>` files: in dev/preview those are served by a Vite middleware, which a static host
# doesn't have, so we materialize them as plain JSON objects. That way the deployed site renders the
# same fine-tuned layouts as the exported GIFs. Diagrams without a saved layout fall back to the
# built-in code defaults automatically (loadLayout() returns empty on a 404).
#
# Usage:
#   ./build-static.sh              # install deps (if needed) + build -> dist/
#   SKIP_INSTALL=1 ./build-static.sh
set -euo pipefail
cd "$(dirname "$0")"

command -v npm >/dev/null 2>&1 || { echo "✗ npm not found on PATH (install Node.js, or run 'nvm use')." >&2; exit 1; }

if [ "${SKIP_INSTALL:-}" != "1" ]; then
  echo "› Installing dependencies…"
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
fi

echo "› Building static bundle (tsc + vite build)…"
npm run build   # -> dist/

# Materialize saved layouts at the path the app fetches: GET /__layout/<id>
if compgen -G "layouts/*.json" > /dev/null; then
  echo "› Bundling saved layouts into dist/__layout/…"
  mkdir -p dist/__layout
  for f in layouts/*.json; do
    cp "$f" "dist/__layout/$(basename "$f" .json)"
  done
fi

# Bundle the rendered GIFs so the static site can serve downloads at /gifs/<id>.gif
if compgen -G "out/*.gif" > /dev/null; then
  echo "› Bundling rendered GIFs into dist/gifs/…"
  mkdir -p dist/gifs
  cp out/*.gif dist/gifs/
fi

echo "✓ Static bundle ready in dist/  ($(du -sh dist | cut -f1))"
echo "  Preview locally:  npx vite preview   (or any static server pointed at dist/)"
echo "  Deploy to AWS:    BUCKET=<name> ./deploy-aws.sh"
