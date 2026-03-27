#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PACKAGE_DIR/../.."
yarn generate-skills

cd "$PACKAGE_DIR"
cp -R ../../skills/user-skills ./dist/skills
