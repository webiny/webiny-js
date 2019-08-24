#!/usr/bin/env bash
lerna version prerelease --yes --conventional-prerelease
lerna publish
# Optionally, run commit/push of CHANGELOG.md