#!/usr/bin/env bash
lerna publish 1.0.0-next.0 --allow-branch=refactor/scoped-packages --no-push --no-git-tag-version --yes
# Optionally, run commit/push of CHANGELOG.md