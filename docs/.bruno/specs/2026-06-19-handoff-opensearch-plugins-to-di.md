# Session Handoff — 2026-06-19 — OpenSearch Plugin Definitions to DI

## What was done

- Deleted 3 dead modifier plugin base classes (`OpenSearchBodyModifierPlugin`, `OpenSearchQueryModifierPlugin`, `OpenSearchSortModifierPlugin`) — already replaced by CMS-side DI abstractions.
- Created `OpenSearchField` DI abstraction + `OpenSearchFieldFactory` following the `createAbstraction`/`createImplementation`/`createFeature` pattern. Factory is resolved from DI and threaded through `feature.ts` → `createEntriesStorageOperations` → `createElasticsearchBody` → `createElasticsearchSort`.
- Created `OpenSearchIndex` DI abstraction + `OpenSearchIndexRegistry` with `{ multiple: true }` DI collection. Replaces `PluginsContainer.byType()` lookup in `indices.ts`.
- Wired all consumers in `api-opensearch` (`sort.ts`, `where.ts`, `indices.ts`, `createIndex.ts`) and `api-headless-cms-ddb-es` (`sort.ts`, `body.ts`, `entry/index.ts`, `feature.ts`) to use new DI abstractions.
- Deleted entire `plugins/definition/` directory and `plugins/` directory from `api-opensearch`. Removed `@webiny/plugins` dependency.
- Fixed 3 test files still importing deleted `OpenSearchContext` type (`handler.ts`, `createIndexTask.test.ts`, `OperationsBuilder.test.ts`).
- Exported `OpenSearchFieldAll` (the `"*"` wildcard constant) from public API surface.
- 9 commits this session, 56 api-opensearch tests passing.

## Key decisions

- `OpenSearchFieldAll` is a standalone `const` export (not a namespace member) because Rspack/swc bundler fails when a namespace contains runtime values alongside a merged `const`. Only `type` members go in namespaces.
- `OpenSearchFieldFactory` is resolved from DI and passed through the call chain rather than having consumers import `OpenSearchFieldImpl` directly. This keeps the DI contract honest.
- `OpenSearchIndexPlugin`'s `type` discriminator (used for `PluginsContainer.byType()`) was dropped — the registry collects all indices and filters by `canUse()`.
- Naming convention enforced: inner class uses `Impl` suffix, export const matches abstraction name, file name matches abstraction name.

## Current state

- Branch: `bruno/refactor/remove-opensearch-context`
- Tests: 56 passed (api-opensearch)
- Build: passing (api-opensearch, api-headless-cms-ddb-es)
- Unpushed commits: 22 total (12 from previous session + 10 this session)
- The `plugins/` directory in `api-opensearch` is now completely gone.

## What might come next

- Remove `StorageOperationsCmsModelPlugin` from `PluginsContainer` (last plugin consumer in entry operations).
- Remove `PluginsContainer` from `StorageOperationsFactoryParams` once fully migrated.
- Remove the `context.__registeredOpensearch` guard in favor of DI singleton guarantees.
- Push and open PR for the full branch.
