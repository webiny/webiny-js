# @webiny/api-search-index-tasks

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-search-index-tasks` is a search-backend-agnostic framework, built on `@webiny/background-tasks`, for three maintenance operations against a search index (Elasticsearch/OpenSearch-shaped, but genericized behind DI abstractions): re-indexing all storage records into a fresh index (`ReindexTask`), re-enabling normal indexing settings after a reindex (`EnableIndexingTask`), and creating any indexes that a running system expects but don't yet exist (`CreateIndexesTask`, with an `onBeforeTrigger` hook that eagerly creates its own task-tracking index). It exposes the actual index/storage operations as small DI abstractions (`IndexManager`/`IndexManagerFactory`, `StorageScanner`, `StorageWriter`, `IndexSettingsManager`, `TenantIndexFactory`) that a concrete search-backend package (e.g. `api-headless-cms-ddb-es`, which implements `TenantIndexFactory`) plugs into; other packages needing "list/create/enable indexing on a search index across all tenants" should implement these abstractions rather than writing their own tenant-fan-out/task-continuation logic. Overall health is good — the code is small, the task-continuation ("close to timeout" → `response.continue`) pattern is applied consistently, and there is zero code duplication — but one real correctness bug was found in `CreateIndexesRunner` (see Bugs) and test coverage is thin (only the reindex path is tested).

## Public API

- `IndexManager`/`IndexManagerFactory` (`src/abstractions/IndexManager.ts:22`, `IndexManagerFactory.ts:13`) — the per-index settings/lifecycle interface (`list`, `indexExists`, `createIndex`, `disableIndexing`, `enableIndexing`) each task handler resolves a fresh instance of via the factory; consumed by all three task handlers (`ReindexTask.ts`, `EnableIndexingTask.ts`, `CreateIndexesTask.ts`).
- `StorageScanner`/`StorageWriter` (`src/abstractions/StorageScanner.ts:20`, `StorageWriter.ts:14`) — the source/sink pair `ReindexRunner` uses to page through existing storage records and batch-write them back (to trigger reindexing); only consumed within this package (plus this package's own tests), so any concrete storage-scan implementation lives in a downstream package not in scope here.
- `TenantIndexFactory` (`src/abstractions/TenantIndexFactory.ts:16`) — per-tenant "which indexes with which settings should exist" provider; codegraph shows it is implemented by `api-headless-cms-ddb-es`'s `CreateElasticsearchIndexTask.ts`, and consumed (as `[TenantIndexFactory, { multiple: true }]`) by `ReindexRunner`, `CreateIndexesRunner`, and `OnBeforeTrigger`.
- `IndexSettingsManager` (`src/abstractions/IndexSettingsManager.ts:9`) — `getSettings`/`setSettings` used by `DisableIndexing`/`EnableIndexing` to toggle `numberOfReplicas`/`refreshInterval` around a reindex.
- `SearchIndexTasksFeature` (`src/feature.ts:12`) — registers all of the above plus the three task definitions; the package's composition root.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/api-search-index-tasks/src/tasks/createIndexes/CreateIndexesRunner.ts:64-65` | Inside the per-index `try` block, `done.push(index)` executes *before* `await factory.create(index, settings)`. If `factory.create` throws (e.g. transient network error, index-already-exists race, quota error), the `catch` block only logs the error — it does not remove `index` from `done`. The index is therefore permanently recorded as "done" even though it was never actually created. | A transient failure while creating one of several missing indexes causes that index to be marked `done` and returned in the task's final `done` list. Because `done` is also used to skip already-handled indexes on task continuation (`if (done.includes(index)) continue;`, line 55), the index is never retried within this task run, and any caller relying on the `done` list (or the index actually existing afterward) will incorrectly believe indexing is fully set up for that index. | high |
| 2 | low | `packages/api-search-index-tasks/src/tasks/createIndexes/createIndexFactory.ts:9-17` | `createIfNotExists` swallows any error from `manager.indexExists(index)` with a bare `catch { return; }` — no logging, no rethrow. If the existence check itself fails (e.g. transient connectivity issue), the function silently returns without creating the index and without surfacing any indication of failure. | `OnBeforeTrigger` (used to ensure the task-tracking index — `["wbytask"]` — exists before the `CreateIndexesTask` itself runs) calls `createIfNotExists` for each candidate index; a transient error on the existence check silently skips index creation with only the outer `OnBeforeTriggerImpl.run`'s generic `console.error(ex)` (which never fires here, since the error is caught inside `createIfNotExists` itself) as a signal — in practice, no error is logged at all for this path. | medium |

## Duplication

jscpd reports zero clones within `api-search-index-tasks` (25 source files, 904 lines, 0 duplicated lines). The `isIndexAllowed(index)` matching-filter closure is reimplemented three times with identical logic (`ReindexRunner.ts:26-32`, `EnableIndexingRunner.ts:17-22`, `CreateIndexesRunner.ts:37-42`) but each is a 5-line closure below jscpd's clone-detection threshold; not worth extracting given its size, though a shared `isIndexAllowed(index, matching)` helper would remove the triplication.

## Dead code

None found. All abstractions and task definitions are registered in `SearchIndexTasksFeature` and have at least one implementer or consumer traced via codegraph (`TenantIndexFactory` → `api-headless-cms-ddb-es`); `StorageScanner`/`StorageWriter`/`IndexManagerFactory`/`IndexSettingsManager` are consumed within the package's own task handlers, which is expected for abstractions whose concrete implementations are registered by downstream, backend-specific packages outside this audit's scope.

## Convention issues

None found. The package follows the DI abstraction/implementation split consistently (one abstraction file, one implementation file, matching names), and `package.json` dependencies (`@webiny/api`, `@webiny/api-core`, `@webiny/background-tasks`, `@webiny/feature`) match what's actually imported in `src`.

## Test gaps

- Only `ReindexRunner` has a dedicated test (`__tests__/reindexRunner.test.ts`, backed by mocks for `StorageScanner`/`StorageWriter`/`IndexManager`/task controller). `EnableIndexingRunner`, `CreateIndexesRunner`, `OnBeforeTrigger`, and the `DisableIndexing`/`EnableIndexing` settings use cases have no tests at all.
- No test covers the `CreateIndexesRunner` bug found above (an index-creation failure incorrectly being recorded as `done`), nor the multi-tenant fan-out (`listIndexes`/`tenantContext.withEachTenant`) path for `CreateIndexesRunner`/`ReindexRunner`'s `buildIndexConfigs`.

## Recommendations

1. Fix `CreateIndexesRunner.ts:64-65`: only push `index` onto `done` after `factory.create(index, settings)` resolves successfully (move the `done.push(index)` call after the `await`, or add it inside a success path so a thrown error leaves the index eligible for retry on the next continuation/run).
2. Add test coverage for `CreateIndexesRunner` and `EnableIndexingRunner` (currently untested), including a case where index creation fails mid-batch, to lock in the fix for bug #1.
3. Have `createIndexFactory.ts`'s `createIfNotExists` log the swallowed `indexExists` error instead of silently returning, so a transient existence-check failure is at least observable in task logs.
