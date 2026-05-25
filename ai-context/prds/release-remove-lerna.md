# PRD: Remove Lerna from Release Pipeline

## Context

The Webiny release tooling (`scripts/release`) currently depends on Lerna for two operations: versioning (`lerna version`) and publishing (`lerna publish`). This is unnecessary overhead — all 118 packages share the same version, the version is always known upfront, and conventional commits are not needed for version computation. Lerna remains useful for the build system's dependency graph (`lerna list --toposort`), but the release pipeline should be self-contained.

The goal is to replace Lerna's version + publish steps with a custom implementation that gives full control over versioning, simplifies the mental model, and removes the conventional-commits-for-versioning dependency.

## CLI Interface

```
yarn release --type=<type> [--version=<semver>] [--tag=<dist-tag>] [--preid=<preid>] [--gitReset] [--createGithubRelease] [--printVersion] [--dryRun]
```

### Arguments

| Argument                | Type              | Required | Description                                                                                                                                                                                                         |
| ----------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--type`                | string            | yes      | Release type: `latest`, `beta`, `unstable`, `verdaccio`                                                                                                                                                             |
| `--version`             | string            | depends  | Base semver (e.g., `6.4.0`). Required for `latest` and `beta`. Rejected for `unstable`/`verdaccio`. Must not contain a prerelease suffix.                                                                           |
| `--tag`                 | string            | no       | NPM dist-tag. Defaults per type. Also used as preid unless `--preid` is set.                                                                                                                                        |
| `--preid`               | string            | no       | Overrides the prerelease identifier in the version string (decouples from `--tag`).                                                                                                                                 |
| `--gitReset`            | boolean           | no       | Reset git changes after publish. Default: `true`.                                                                                                                                                                   |
| `--createGithubRelease` | boolean\|"latest" | no       | Create a GitHub release. "latest" marks it as the latest release.                                                                                                                                                   |
| `--printVersion`        | boolean           | no       | Compute and print the version without publishing.                                                                                                                                                                   |
| `--dryRun`              | boolean           | no       | Run the full pipeline (version computation, prepublishOnly, version rewriting) but skip npm publish, GitHub release creation, and git reset. Useful for inspecting `dist/package.json` files before a real release. |

### Removed Arguments

| Argument      | Reason                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| `--sourceTag` | No longer needed — version is specified manually, not graduated from another tag. |

## Release Types

### Latest

- **Default tag:** `latest`
- **Version:** Exact `--version` value (e.g., `6.4.0`)
- **GitHub release:** Yes (with changelog from `Changelog.ts`)
- **Validation:** `--version` required, must be clean semver (no prerelease suffix)

### Beta

- **Default tag:** `beta`
- **Version:** `<--version>-<preid>.<N>` where `<N>` is auto-incremented
- **Preid:** `--preid` if set, otherwise `--tag` value, otherwise `beta`
- **Auto-increment logic:**
  1. Fetch current version from NPM `beta` dist-tag (canary package: `@webiny/cli`)
  2. If current NPM version's base (major.minor.patch) matches `--version`, increment the prerelease suffix (e.g., `6.4.0-beta.3` -> `6.4.0-beta.4`)
  3. If base version differs, start at `.0` (e.g., `6.5.0-beta.0`)
- **GitHub release:** No
- **Validation:** `--version` required, must be clean semver

### Unstable

- **Default tag:** `unstable`
- **Version:** `0.0.0-<tag>.<short-commit-hash>` (auto-generated)
- **GitHub release:** No
- **Validation:** `--version` must NOT be provided

### Verdaccio

- **Default tag:** `local-npm`
- **Version:** `0.0.0-<tag>.<short-commit-hash>` (auto-generated, same as unstable)
- **GitHub release:** No
- **Validation:** `--version` must NOT be provided

## Execution Flow

```
1. Validate inputs (type, version format, required args)
2. Compute final version
   - latest: use --version as-is
   - beta: fetch NPM tag, compute next prerelease suffix
   - unstable/verdaccio: generate from commit hash
3. If --printVersion: print version and exit
4. Run root prepublishOnly (yarn prepublishOnly)
5. Rewrite versions in dist/package.json for all packages/*
   - Set "version" field to computed version
   - Rewrite all @webiny/* dependency versions to computed version
   - Skip private packages
6. If --dryRun: log summary and exit (skip steps 7-9)
7. Publish all packages in parallel (concurrency ~10)
   - For each non-private package in packages/*:
     - Read publishConfig.directory (default: package root)
     - Run: npm publish <dir> --tag <dist-tag>
     - Retry up to 3 times on failure
   - Collect and report all failures at the end
8. If createGithubRelease:
   - Create git tag (v<version>)
   - Push tag to origin
   - Generate changelog using Changelog.ts (from last latest tag to current)
   - Create GitHub release via Octokit
9. If gitReset: git reset --hard HEAD
```

## Version Rewriting

Only `dist/package.json` (or root `package.json` for non-buildable packages) gets rewritten. Source `package.json` files stay at `0.0.0`.

For each non-private package:

1. Determine target file: if `src/` dir exists -> `dist/package.json`, otherwise `package.json`
2. Set `"version"` to computed version
3. For every entry in `dependencies`, `devDependencies`, `peerDependencies`:
   - If key starts with `@webiny/` -> set value to computed version

## Architecture

Keep the existing class hierarchy:

```
Release (base class)
├── LatestRelease
├── BetaRelease
├── UnstableRelease
└── VerdaccioRelease
```

### Key Changes to Release Base Class

- Remove `lerna version` call -> replace with custom version rewriter
- Remove `lerna publish` call -> replace with parallel `npm publish` loop
- Remove `example.lerna.json` loading
- Remove NPM tag-based version inference (move beta-specific logic to `BetaRelease`)
- Add `computeVersion()` abstract/overridable method
- Add `versionPackages()` -> rewrites `dist/package.json` files
- Add `publishPackages()` -> parallel npm publish with retry
- Keep `Changelog.ts` integration for GitHub releases

### New Utilities

- **Version rewriter** — globs `packages/*`, reads/writes `dist/package.json`, updates version + `@webiny/*` deps
- **Package publisher** — parallel npm publish with concurrency limit and per-package retry
- **NPM tag reader** — fetch dist-tags from registry for `@webiny/cli` (extracted from current `__getTags`)

## Files to Modify

| File                                      | Change                                                        |
| ----------------------------------------- | ------------------------------------------------------------- |
| `scripts/release/src/Release.ts`          | Replace lerna calls with custom version rewrite + npm publish |
| `scripts/release/src/BetaRelease.ts`      | Implement NPM lookup + prerelease increment logic             |
| `scripts/release/src/LatestRelease.ts`    | Simplify to use exact `--version`                             |
| `scripts/release/src/UnstableRelease.ts`  | Simplify to use commit hash version                           |
| `scripts/release/src/VerdaccioRelease.ts` | Simplify to use commit hash version (same as unstable)        |
| `scripts/release/src/index.ts`            | Add `--preid` arg, remove `--sourceTag`, update validation    |
| `scripts/release/src/releaseTypes.ts`     | No change (keep registry)                                     |
| `scripts/release/src/GithubRelease.ts`    | No change                                                     |
| `scripts/release/src/Changelog.ts`        | No change                                                     |
| `scripts/release/src/ConsoleLogger.ts`    | No change                                                     |
| `scripts/release/package.json`            | Keep conventional-changelog deps, no lerna dep here           |

## Files to Remove

| File                 | Reason                                           |
| -------------------- | ------------------------------------------------ |
| `example.lerna.json` | No longer used to seed lerna.json for versioning |

## Files to Add

| File                                     | Purpose                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `scripts/release/src/versionPackages.ts` | Glob packages/_, rewrite version + @webiny/_ deps in dist/package.json |
| `scripts/release/src/publishPackages.ts` | Parallel npm publish with concurrency + retry                          |
| `scripts/release/src/fetchNpmVersion.ts` | Fetch dist-tags from NPM registry for @webiny/cli                      |

## CI Workflow Updates

Workflows are defined as TypeScript in `.github/workflows/wac/` and compiled to YAML via `yarn ci-workflows:build` (`ghawac build`).

| WAC Source                           | Change                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `wac/release.wac.ts`                 | Add `version` input to workflow_dispatch, pass `--version` to release command                                                       |
| `wac/fullRelease.wac.ts`             | Already has `version` input — wire it through to release command                                                                    |
| `wac/unstableRelease.wac.ts`         | No change                                                                                                                           |
| `wac/pullRequestsCommandBeta.wac.ts` | Parse version from PR branch name (`release/6.4.0` -> `6.4.0`), pass as `--version`. Remove `--sourceTag` from latest release step. |

After editing `.wac.ts` files, regenerate YAML with `yarn ci-workflows:build`.

## Validation Rules

| Condition                                            | Error                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `--type` missing                                     | `Missing required "--type" option.`                                   |
| `--version` missing for latest/beta                  | `"--version" is required for <type> releases.`                        |
| `--version` provided for unstable/verdaccio          | `"--version" is not allowed for <type> releases.`                     |
| `--version` contains prerelease suffix               | `"--version" must be a clean semver (e.g., 6.4.0), not a prerelease.` |
| `--version` is not valid semver                      | `"--version" must be a valid semver string.`                          |
| `GH_TOKEN` missing when `createGithubRelease` is set | `GH_TOKEN environment variable is not set.`                           |

## Verification

1. **Unit test version computation:**
   - Beta: NPM has `6.4.0-beta.3` -> next is `6.4.0-beta.4`
   - Beta: NPM has `6.3.0-beta.5`, `--version=6.4.0` -> next is `6.4.0-beta.0`
   - Beta: NPM has no beta tag -> `6.4.0-beta.0`
   - Unstable: generates `0.0.0-unstable.<hash>`
   - Latest: passes through exact version

2. **Integration test version rewriting:**
   - Create temp package dirs with `dist/package.json` containing `@webiny/*` deps at `0.0.0`
   - Run version rewriter
   - Verify all `version` fields and `@webiny/*` deps are updated

3. **Dry-run with `--printVersion`:**
   - `yarn release --type=beta --version=6.4.0 --printVersion` -> prints computed version
   - `yarn release --type=unstable --printVersion` -> prints hash-based version

4. **End-to-end with Verdaccio:**
   - Start local Verdaccio instance
   - Run `yarn release --type=verdaccio`
   - Verify packages published to local registry with correct versions
