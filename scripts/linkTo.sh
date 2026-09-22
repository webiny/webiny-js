#!/usr/bin/env bash
# Link this repo's @webiny packages into another project's node_modules.
#
# Usage:  scripts/linkTo.sh /path/to/consumer-project
#
# The consumer's run command should pass NODE_PATH pointing here so transitive
# deps (pino-pretty, thread-stream, etc.) resolve at runtime:
#   NODE_PATH=../../webiny-6.5.x/node_modules npm run dev
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$1"

if [ ! -d "$TARGET" ]; then
  echo "Usage: scripts/linkTo.sh <consumer-project-path>"
  exit 1
fi

if [ ! -d "$REPO_DIR/node_modules/@webiny" ]; then
  echo "ERROR: $REPO_DIR/node_modules/@webiny not found — run yarn in this repo first."
  exit 1
fi

mkdir -p "$TARGET/node_modules"
ln -sfn "$REPO_DIR/node_modules/@webiny" "$TARGET/node_modules/@webiny"
echo "Linked $TARGET/node_modules/@webiny → $REPO_DIR/node_modules/@webiny"
