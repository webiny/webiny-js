# @webiny/shared-aco

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

A tiny shared library for the ACO (Advanced Content Organization / folders) feature: it builds folder paths (`Path.create`) and merges folder-level permissions (FLP) between a folder and its parent (`Permissions.create`), plus the `ROOT_FOLDER` constant and the `FolderPermission`/`FolderLevelPermission`/`FolderAccessLevel` types shared by both the api and admin ACO packages. `Permissions.create` is the one non-trivial piece of logic in the package — it decides which permissions a folder record should persist given its own raw permissions and its parent's resolved ones, and is careful to never let code-contributed (`plugin: true`) permissions leak into storage. Overall health is fine but the merge logic has a real edge case (see Bugs) and no tests of its own.

## Public API

- `Path.create(slug, parentPath?)` (`src/flp/Path.ts:4`) — used by `api-aco`'s `CreateFolderRepository`/`CodeFlpPath` and `app-aco`'s `RepositoryWithPathChange` to build/recompute folder paths (`~3` consumers).
- `Permissions.create(permissions?, parentFlp?)` (`src/flp/Permissions.ts:4`) — used by `api-aco`'s `CreateFlpUseCase`/`UpdateFlpUseCase` and `app-aco`'s `RepositoryWithPermissionsChange` to compute the FLP record that should be persisted for a folder (`~3` consumers).
- `ROOT_FOLDER` constant (`src/constants.ts:1`) — re-exported by `app-aco/src/constants.ts` and consumed directly by `api-aco` (`UpdateFlpUseCase`, `CreateFlpUseCase`, `CodeFlpPath`), `app-aco`'s `RootFolder.ts`, and workflow packages `api-headless-cms-workflows` and `api-website-builder-workflows` (for workflow-state folder filtering).
- `FolderPermission` / `FolderLevelPermission` / `FolderAccessLevel` types (`src/flp/flp.types.ts`) — re-exported wholesale by `api-aco/src/flp/flp.types.ts` and `app-aco/src/types.ts`, so effectively part of both packages' public surfaces too.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | medium | `src/flp/Permissions.ts:12-17` | `Permissions.create` only strips an echoed-back permission when its `inheritedFrom` marker equals `parent:<CURRENT parentFlp.id>` (line 16: `p.inheritedFrom !== inheritedFromParent`). A permission whose `inheritedFrom` points at a *different* (e.g. previous) parent id is not recognized as "inherited" at all and is treated as a genuine current-folder override. | Folder F inherits a permission from parent A, so a read of F returns `{ ...perm, inheritedFrom: "parent:A" }` in its permissions array. F is then re-parented under B (which has no conflicting permission on the same target). If that same permissions array is later re-submitted for F (e.g. via `app-aco`'s `RepositoryWithPermissionsChange`, which calls `Permissions.create(f.permissions, newParentFlp)` whenever the cached permissions differ from what's passed in), `inheritedFromParent` is now `"parent:B"`, so the stale `"parent:A"` entry is not filtered out and gets persisted as F's own current-folder permission — permanently baking in a permission that should have disappeared once F stopped descending from A. | medium |

## Duplication

No intra-package clones (jscpd: 0 duplicates). No reimplementation of this merge logic found elsewhere in the repo.

## Dead code

None found — every export has confirmed external consumers (see Public API).

## Convention issues

None meaningful. `Path` and `Permissions` each get their own file with one class each, per `one-class-per-file`; types live in `flp.types.ts` separately from logic.

## Test gaps

The package has **no test files at all**. `Permissions.create` is the riskiest piece of logic here — it has multiple branches (no-parent-permissions fast path, `no-access` parent override, per-target dedup) and the edge case in Bugs #1 above would have been easy to catch with a test that round-trips a permission through a re-parent. `Path.create`'s root-vs-nested branching is simple but also untested in isolation (it is only exercised transitively through `app-aco`/`api-aco` tests).

## Recommendations

1. Fix or explicitly document `Permissions.create`'s handling of stale `inheritedFrom` markers (`src/flp/Permissions.ts:15-17`) — either strip any permission whose `inheritedFrom` starts with `"parent:"` regardless of which parent it names (since such a permission should never be treated as a real override), or confirm at the call sites that the permissions array passed in is always re-resolved fresh (no stale markers) before re-parenting, and add a comment/test to make that invariant explicit.
2. Add a small unit test suite for `Permissions.create` covering: no-parent, `no-access` parent overriding a child override, precedence of a matching child override, and the re-parent/stale-marker scenario above.
3. Add a one-line test for `Path.create`'s two branches (root vs. nested parent path) — cheap insurance for a function referenced from both `api-aco` and `app-aco`.
