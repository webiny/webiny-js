#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PACKAGE_DIR/../.."
echo "Generate skills"
yarn generate-skills

cd "$PACKAGE_DIR"
echo "Copy skills to dist"
cp -R ../../skills/user-skills ./dist/skills
