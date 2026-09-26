# @webiny/api-aco

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-aco` is the backend for Advanced Content Organisation (folders): a folder CRUD feature-slice (`features/folder/*`), a folder-level-permissions (FLP) catalog feature-slice (`features/flp/*`, backed by `@webiny/shared-aco`'s `Permissions.create`/`Path.create`), and a large set of `*WithFlpDecorator` classes that wrap `@webiny/api-headless-cms`'s content-entry use cases so that CMS reads/writes are additionally gated by the folder the entry lives in. The core per-request access checks (`CanAccessFolder`, `CanAccessFolderContent`) are simple and correct, and every folder query decorator (list, get, hierarchy) filters results down to what the caller's resolved (team-aware) permissions allow. Two security findings are tracked privately (SEC-43, SEC-44). Other packages should reuse `FolderLevelPermissions.canAccessFolder`/`canAccessFolderContent` (via DI) rather than re-deriving folder access checks.

## Public API
- `FolderLevelPermissions` (`src/features/flp/FolderLevelPermissions/FolderLevelPermissions.ts:182`) — DI abstraction exposing `canAccessFolder`/`canAccessFolderContent`/`ensureCanAccessFolder`/`getFolderLevelPermissions`/`getDefaultPermissions`/etc.; consumed by every folder-feature decorator and every CMS `*WithFlpDecorator` in this package (~20 internal consumers), plus `NoopFolderLevelPermissions` as the fallback implementation when the FLP entitlement/feature flag isn't enabled.
- The `*WithFlpDecorator` family (`features/cms/decorators/*`, `features/folder/*/decorators/*`) — each decorates one `@webiny/api-headless-cms` content-entry or one local folder use case; registered from `CmsFlpFeature`/`AcoFeature`. These are the package's main integration surface with `api-headless-cms`.
- `AcoFeature` (`src/AcoFeature.ts`) — the composition root wiring all folder/FLP/CMS-decorator/AI-tool sub-features together; used by project handlers to enable ACO.
- Legacy `flp/flp.crud.ts` (`createFlpCrudMethods`) — tenant-scoped storage facade still used as the underlying `AcoFlpCrud` implementation feeding the newer `features/flp/*` use cases; not itself a public surface but worth noting it, not `features/flp`, is where tenant scoping (`getTenant().id`) is actually applied on every write.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | packages/api-aco/src/features/flp/UpdateFlp/UpdateFlpUseCase.ts | Security finding SEC-43 — see private notes. | — | high |
| 2 | high | packages/api-aco/src/features/cms/feature.ts | Security finding SEC-44 — see private notes. | — | high |
| 3 | medium | `src/features/folder/UpdateFolder/UpdateFolderRepository.ts:24-77` and `src/features/folder/UpdateFolder/decorators/UpdateFolderWithFolderLevelPermissions.ts:29-141` | Moving a folder (`params.parentId`) never checks whether the new `parentId` is the folder itself or one of its own descendants. Neither the repository (which only checks slug/path collisions) nor the FLP decorator (which only checks read/write access on old and new parent) rejects a cyclic re-parent. | An admin with write access to folders A, B and C (A → B → C in the tree) moves A so that `A.parentId = C`. Nothing rejects this, producing a cycle A → B → C → A. `GetAncestorsRepository.findParents` (`src/features/folder/GetAncestors/GetAncestorsRepository.ts:63-83`) walks `current.parentId` via a `Map` with no visited-set/depth guard, so any subsequent `GetFolderHierarchy`/breadcrumb read that reaches this cycle recurses forever, and folder `path` values become internally inconsistent (a folder's path segment is itself an ancestor). | medium |

## Duplication
jscpd (`{JSCPD}/jscpd-api-aco/jscpd-report.json`) reports 16 clone pairs, all within the package and all structural, matching the intentional "one decorator per use case" pattern rather than accidental copy-paste:
- `CanAccessFolder.ts:12-23` / `CanAccessFolderContent.ts:11-` — near-identical `no-access`/rwd-branch logic duplicated between the folder-level and folder-content checks (`src/features/flp/FolderLevelPermissions/useCases/{CanAccessFolder,CanAccessFolderContent}/*.ts`).
- The read-side CMS decorators (`ListLatestEntriesWithFlpDecorator.ts`, `ListPublishedEntriesWithFlpDecorator.ts`, `ListEntriesWithFlpDecorator.ts`, `ListDeletedEntriesWithFlpDecorator.ts`, `GetLatestEntriesByIdsWithFlpDecorator.ts`/`GetPublishedEntriesByIdsWithFlpDecorator.ts`, `GetEntryByIdWithFlpDecorator.ts`/`GetEntryWithFlpDecorator.ts`) are pairwise near-duplicates of each other (same fetch-permissions/filter-by-folder shape, ~20-40 lines each).
- `CreateFolderWithFolderLevelPermissions.ts:69-86` / `UpdateFolderWithFolderLevelPermissions.ts:186-` (`withCodePermissions` helper) and `CreateFolderRepository.ts:85-135` / `UpdateFolderRepository.ts:102-` (repository persistence shape) duplicate each other.
- `GetFolderHierarchyWithFolderLevelPermissions.ts` duplicates large parts of `ListFoldersWithFolderLevelPermissions.ts` (FLP-catalog-population + filter-by-access loop).
- `utils/decorators/CmsEntriesCrudDecorators.ts` has two internal near-duplicate blocks (59-95, 137-167).
- `flp/tasks/createFlp.task.ts:12-22` / `flp/tasks/deleteFlp.task.ts:12-` duplicate task-definition boilerplate.

None of this duplication is a correctness risk by itself, but it means a fix to one decorator's access-check logic (e.g. the missing restore decorator above) is easy to under-apply since there is no shared base class enforcing the pattern.

## Dead code
- `ListCache` (`src/utils/ListCache.ts`) and `FoldersCacheFactory`/`folderCacheFactory` (`src/utils/FoldersCacheFactory.ts:31`) — codegraph/grep: no consumers anywhere in `packages/api-aco/src` beyond their own definitions. `folderCacheFactory` is also a bare module-level singleton (not DI-registered), which would have been a cross-request/cross-tenant caching risk had it actually been wired in anywhere — worth deleting rather than leaving as an attractive nuisance for a future contributor to wire up as-is.

## Convention issues
- `folderCacheFactory` (`src/utils/FoldersCacheFactory.ts:31`) is a plain exported singleton instance rather than a DI-registered abstraction/implementation pair, inconsistent with the rest of the package's DI conventions (every other piece of shared state, e.g. the per-decorator `flpCatalog` `Map`, is instance-scoped inside a DI-constructed class instead).
- No other meaningful AGENTS.md convention violations found; the DI naming (`XxxUseCase`/`abstractions.ts`/`feature.ts`/`index.ts` per folder) and one-per-file structure are followed consistently across `features/`.

## Test gaps
- No test exercises a folder re-parent (move) followed by a check that a permission inherited from the *old* parent is no longer present/effective on the folder — `folder.flp.inheritance.test.ts` covers inheritance and override behavior only for static (non-moved) trees, and `folder.flp.security.test.ts` covers "moving to an inaccessible folder" (access-check-on-move) but not "what happens to already-inherited permissions after a successful move." This is exactly the gap bug #1 lives in.
- No test covers restoring an entry from the trash bin with insufficient folder permissions (bug #2) — `flp.cms.test.ts` and related suites cover create/update/delete/move but not restore-from-bin, publish, unpublish, or republish.
- No test covers moving a folder under its own descendant (cycle) or verifies `GetAncestors`/`GetFolderHierarchy` behavior on a malformed tree.

## Recommendations
1. Address security finding SEC-43 (see private notes).
2. Address security finding SEC-44 (see private notes).
3. Reject a folder move whose target `parentId` is the folder itself or one of its own descendants (e.g. by walking the target's ancestors via the existing `GetAncestorsRepository` before persisting), and add a visited-set/depth guard to `GetAncestorsRepository.findParents` as defense in depth.
