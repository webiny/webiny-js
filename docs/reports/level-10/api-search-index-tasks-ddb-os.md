# @webiny/api-search-index-tasks-ddb-os

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-search-index-tasks-ddb-os` is the thin DynamoDB-side glue for `@webiny/api-search-index-tasks`'s reindex framework: `DdbStorageScanner` (paginated `scan()` over the DynamoDB→OpenSearch streaming table via `@webiny/db-dynamodb`'s `scan`, producing an opaque `{PK, SK}` JSON cursor) and `DdbStorageWriter` (buffers records per entity type and flushes them via `@webiny/db-dynamodb`'s `createTableWriteBatch`), composed by `SearchIndexTasksDdbOsFeature` alongside `api-search-index-tasks-os`'s OpenSearch-side abstractions. The package is tiny (3 files, ~140 lines), has zero jscpd duplication, and no bugs were found in the write path; its one weak spot is that `DdbStorageScanner.scan()` does an unguarded `JSON.parse(cursor)` with no validation, which would throw if a malformed cursor were ever passed in. No automated tests exist for this package.

## Public API
- `SearchIndexTasksDdbOsFeature` (`src/index.ts:6`) — the composition root; registers `api-search-index-tasks-os`'s feature plus `DdbStorageScanner`/`DdbStorageWriter`. Codegraph: consumed by `api-headless-cms-ddb-es` (`packages/api-headless-cms-ddb-es/__tests__/context/useHandler.ts`), the DDB+OpenSearch content-entry backend that needs a concrete reindex storage implementation.
- `DdbStorageScanner` (`src/storage/StorageScanner.ts:64`) — implements `api-search-index-tasks`'s `StorageScanner` abstraction; used by `ReindexTask` in `api-search-index-tasks` to page through all records for a full reindex.
- `DdbStorageWriter` (`src/storage/StorageWriter.ts:59`) — implements `api-search-index-tasks`'s `StorageWriter` abstraction; used by the same reindex flow to batch-write records into a freshly created index's backing table.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | low | `src/storage/StorageScanner.ts:32` | `scan(cursor, limit)` does `JSON.parse(cursor)` directly with no try/catch, unlike the sibling `api-audit-logs-ddb` package's `cursorSchema.ts`, which validates cursors with a zod schema before use. | If the continuation cursor a caller passes back in is ever truncated, corrupted, or otherwise not valid JSON (e.g. due to a bug elsewhere in the task-continuation chain, or if it were ever exposed to external input), `scan()` throws an uncaught `SyntaxError` instead of failing gracefully, aborting the in-progress reindex task. Not currently confirmed to be reachable from external/untrusted input — the cursor is only ever produced by this same class's own `JSON.stringify` — so this is a defensive-robustness gap rather than a demonstrated exploit path. | low |

## Duplication
None — jscpd reports zero clones, and `DdbStorageScanner`/`DdbStorageWriter` each wrap distinct `@webiny/db-dynamodb`/`@webiny/api-opensearch-aws` primitives (`scan`, `createTableWriteBatch`, `createOpenSearchTable`/`createOpenSearchEntity`) without reimplementing any of that lower-level logic.

## Dead code
None found — both `DdbStorageScanner` and `DdbStorageWriter` have exactly one caller each (`src/index.ts`), and `SearchIndexTasksDdbOsFeature` itself has a confirmed external consumer (codegraph, see Public API).

## Convention issues
None meaningful. Minor naming note: the implementation files are named after the abstraction (`StorageScanner.ts`, `StorageWriter.ts`) rather than the concrete `Ddb`-prefixed class/export they contain, which differs slightly from the "impl files use the class name" convention seen elsewhere in the repo, but this is consistent with the package's own `storage/` folder layout and not confusing in context.

## Test gaps
The package has no `__tests__` directory at all. `DdbStorageScanner.scan()`'s cursor-building logic (including the `results.lastEvaluatedKey?.PK && results.lastEvaluatedKey?.SK` guard) and `DdbStorageWriter`'s per-entity buffering/flush behavior are entirely untested within this package (only exercised indirectly via `api-headless-cms-ddb-es`'s handler tests).

## Recommendations
1. Wrap `JSON.parse(cursor)` in `scan()` with a try/catch (or a small validation schema, mirroring `api-audit-logs-ddb`'s `cursorSchema.ts`) so a malformed cursor fails predictably instead of throwing an uncaught `SyntaxError`.
2. Add package-local unit tests for `DdbStorageScanner.scan()` (cursor round-trip, `lastEvaluatedKey` presence/absence) and `DdbStorageWriter.execute()` (buffering and flush), rather than relying solely on `api-headless-cms-ddb-es`'s integration tests.
3. No action needed on duplication or dead code — the package is small, clean, and fully reachable.
