# @webiny/api-sync-to-opensearch

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-sync-to-opensearch` provides the shared, storage-agnostic building blocks used by the DynamoDB- and Postgres-specific "sync to OpenSearch" packages: an `Operations` value object that accumulates OpenSearch bulk-API index/delete entries, an `OperationsBuilder` abstraction each storage driver implements to turn its own change records into `Operations`, and `ExecuteSync`/`ExecuteSyncWithRetry`/`SynchronizationBuilder` features that wait for a healthy OpenSearch cluster (via `@webiny/api-opensearch`), submit the bulk request, and retry with backoff (via `p-retry`) while respecting the remaining Lambda execution time (via `@webiny/utils`'s `Timer`). It correctly builds on `api-opensearch`'s health-check and client utilities rather than reimplementing them. Overall health is good: the package is small, the DI wiring is clean and consistent with the rest of the monorepo, and its core `Operations` behaviour is unit tested. The main weakness is a cosmetic but real accuracy bug in the "records transferred" log line, and thin test coverage outside of `Operations`.

## Public API
- `Operations` / `OperationType` (`src/features/Operations/abstractions/Operations.ts`, `src/features/Operations/Operations.ts`) — the bulk-operations accumulator; consumed directly by both `api-sync-ddb-to-opensearch` and `api-sync-pg-to-opensearch`'s `OperationsBuilder` implementations.
- `OperationsBuilder` (`src/features/OperationsBuilder/abstraction.ts`) — implemented by ~2 downstream packages (`DdbOperationsBuilder`, `PgOperationsBuilder`), consumed by their respective handler entry points (~4-7 call sites per codegraph).
- `ExecuteSyncWithRetry` (`src/features/ExecuteSyncWithRetry/ExecuteSyncWithRetry.ts`) — consumed by `SynchronizationBuilder` internally and directly by `api-sync-ddb-to-opensearch`'s and `api-sync-pg-to-opensearch`'s handlers (~4 external call sites).
- `SynchronizationBuilder` — consumed by `api-headless-cms-pg-os`'s `SyncEventHandler` (1 external consumer) plus its own feature registration.
- `NotEnoughRemainingTimeError` — thrown by `ExecuteSyncWithRetry` when the Lambda is close to timing out mid-retry; re-exported for callers to catch/identify.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `src/features/ExecuteSync/ExecuteSync.ts:134` | The success log uses `operations.total`, which is `items.length` — the raw bulk-API array length (2 array entries per insert/modify, 1 per delete) — not the actual number of records processed. | After a batch of, say, 10 inserts and 5 deletes, the log prints "Transferred 25 record operations" (10*2+5) instead of 15, misleading anyone reading CloudWatch logs to diagnose throughput/backlog. Confirmed downstream that the correct record count is exposed separately as `operations.count` (used correctly by `api-sync-ddb-to-opensearch`'s `DdbToOpenSearchHandler.ts:35` for `processedRecords`), so the package itself already has the right value available and simply logs the wrong field. | high |

## Duplication
jscpd found no clones within the package (`jscpd-report.json` shows `clones: 0` for every source file). No duplication of `@webiny/api-opensearch` or `@webiny/utils` logic was observed — the package delegates health-checking to `createWaitUntilHealthy` and remaining-time tracking to `Timer` rather than reimplementing them.

## Dead code
None found. Every exported abstraction/feature/implementation has at least one confirmed consumer via codegraph, either internally (e.g. `ExecuteSync` used only by `ExecuteSyncWithRetry`) or in the downstream `api-sync-ddb-to-opensearch`/`api-sync-pg-to-opensearch`/`api-headless-cms-pg-os` packages.

## Convention issues
None found. The package consistently follows the one-abstraction/one-implementation/one-feature-per-file pattern, implementation files are named after the abstraction (e.g. `ExecuteSync.ts`, not `implementation.ts`), and the barrel export in `src/index.ts` exposes only what downstream packages actually import (abstractions, feature bundles, and the one custom error type).

## Test gaps
- `ExecuteSync`, `ExecuteSyncWithRetry`, and `SynchronizationBuilder` have no unit tests at all — only `Operations` is tested (`__tests__/Operations.test.ts`). In particular, the bulk-error handling in `ExecuteSync.execute` (the `getError`/`checkErrors` logic that distinguishes a missing-index error from a hard failure) and the retry/abort logic in `ExecuteSyncWithRetry` (aborting via `NotEnoughRemainingTimeError` when remaining time drops below the threshold) are untested.
- No test exercises the "not enough remaining time" abort path end-to-end, so a regression in the threshold check (`minRemainingSecondsToTimeout` in `ExecuteSyncWithRetry.ts`) would not be caught.

## Recommendations
1. Fix the log message in `ExecuteSync.ts:134` to report `operations.count` instead of `operations.total` so operational logs reflect the real number of synced records.
2. Add unit tests for `ExecuteSync.execute`'s bulk-error classification (`getError`/`checkErrors`) and for `ExecuteSyncWithRetry`'s early-abort-on-low-remaining-time behaviour, since these are the only real branching logic in the package and currently have zero coverage.
3. Consider covering `SynchronizationBuilder.build()`'s no-op-when-empty and clear-after-execute behaviour with a small test, since it's the main integration point consumed by `api-headless-cms-pg-os`.
