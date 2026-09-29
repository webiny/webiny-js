# @webiny/api-search-index-tasks-os

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-search-index-tasks-os` is the thin OpenSearch/Elasticsearch backend for `@webiny/api-search-index-tasks`'s generic "list/create/enable/disable indexing" abstractions: `OsIndexManager` (list indices via `cat.indices`, create an index, check existence, enable/disable indexing settings with local caching of prior settings) and `IndexSettingsManagerImpl` (get/set `number_of_replicas`/`refresh_interval` directly against the OpenSearch client). It is small (215 lines, 6 files), has zero jscpd duplication, and correctly reuses `@webiny/api-opensearch`'s `OpenSearchClient` DI abstraction rather than building its own client. The one real issue is that `OsIndexManager.list()` swallows all OpenSearch errors and returns an empty array, which — because `EnableIndexingRunner` (in `api-search-index-tasks`) uses this list to decide which indices to re-enable after a reindex — turns a transient API failure into a silent no-op that leaves indices stuck with reindex-time settings (e.g. disabled refresh) with no error surfaced anywhere.

## Public API
- `IndexManagerFactory` (`src/indexManager/IndexManagerFactory.ts:25`) and `OsIndexManager` (`src/indexManager/IndexManager.ts:25`) — implement `@webiny/api-search-index-tasks`'s `IIndexManagerFactory`/`IIndexManager` abstractions. Consumed by `CreateIndexesTask`, `EnableIndexingTask`, and `ReindexTask` in `api-search-index-tasks` (codegraph: 4 callers of the factory abstraction), which in turn are used by `api-headless-cms-ddb-es` (`CreateElasticsearchIndexTask.ts`) as the concrete search backend.
- `IndexSettingsManager` (`src/settings/IndexSettingsManager.ts:43`) — implements `api-search-index-tasks`'s `IndexSettingsManager` abstraction; consumed by that package's `DisableIndexing`/`EnableIndexing` use cases (codegraph: 3 callers).
- `SearchIndexTasksOsFeature` (`src/index.ts:5`) — registers both of the above into the DI container; wired wherever a project composes the OpenSearch-backed search-index-tasks stack (e.g. alongside `api-headless-cms-ddb-es`).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/api-search-index-tasks-os/src/indexManager/IndexManager.ts:64-72` | `list()` catches any error from `client.cat.indices()` (network blip, cluster overload, auth failure) and returns `[]` after only a `console.error` — the caller cannot distinguish "no indices" from "listing failed". | `EnableIndexingRunner.execute` (`packages/api-search-index-tasks/src/tasks/enableIndexing/EnableIndexingRunner.ts:24`) calls `indexManager.list()` to get the indices it needs to re-enable normal refresh/replica settings on after a reindex. If the OpenSearch call transiently fails, `list()` returns `[]`, the loop body never runs, and the task still returns `response.done(...)` with empty `enabled`/`failed` arrays — i.e. success, with nothing actually re-enabled. Indices left with reindex-time settings (e.g. `refresh_interval: -1`) stay that way indefinitely, silently degrading search (new documents stop becoming searchable) with no error anywhere in the task result or logs the DI logger would surface (the failure is only a raw `console.error`). | medium (chain to `EnableIndexingRunner` confirmed via grep; requires a transient OpenSearch error to trigger, not reproduced live) |

## Duplication
None found (jscpd report for this package shows 0% duplication across all files).

## Dead code
None found — all three DI-registered implementations (`OsIndexManager`, `IndexManagerFactory`, `IndexSettingsManager`) have confirmed consumers in `@webiny/api-search-index-tasks` (see Public API).

## Convention issues
- `packages/api-search-index-tasks-os/src/indexManager/IndexManager.ts:65` uses `console.error` directly instead of the DI `Logger`, the same `no-console-in-backend.md` violation already flagged at level 2 in `@webiny/api-opensearch`. Here it's also the only signal emitted for the silent-failure bug above, so fixing the logging would also make the failure observable.

## Test gaps
- `IndexSettingsManagerImpl.getSettings`/`setSettings` (`src/settings/IndexSettingsManager.ts`) have no test file at all — neither the success path nor the `IndexSettingsGetError`/`IndexSettingsSetError` wrapping is exercised.
- `OsIndexManager.list()`, `createIndex()`, and `indexExists()` are not covered by `__tests__/indexManager.test.ts` (only the constructor, `disableIndexing`, and `enableIndexing` paths are tested), so the silent-failure behavior in Bug #1 has no regression test either for the error path or the happy path.

## Recommendations
1. Fix `list()` (`IndexManager.ts:64-72`) to distinguish a genuinely empty index list from a failed OpenSearch call — rethrow (or return a distinguishable error result) instead of swallowing to `[]`, so `EnableIndexingRunner` doesn't silently no-op after a reindex.
2. Replace the `console.error` at `IndexManager.ts:65` with the DI `Logger` used elsewhere in the request stack, consistent with the level-2 finding in `api-opensearch`.
3. Add tests for `IndexSettingsManagerImpl` (get/set, including the error-wrapping paths) and for `OsIndexManager.list()`/`createIndex()`/`indexExists()`, including a simulated `cat.indices` failure to cover Bug #1.
