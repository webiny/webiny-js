# @webiny/api-sync-pg-to-opensearch

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-sync-pg-to-opensearch` is the Postgres (logical replication / WAL) adapter of Webiny's "sync to OpenSearch" system — the sibling of `@webiny/api-sync-ddb-to-opensearch`, built on the same `@webiny/api-sync-to-opensearch` primitives (`Operations`, `OperationsBuilder`, `ExecuteSyncWithRetry`). It turns a plain array of `PgWalChangeRecord` (already-flattened change records with an `id`/`index`/`operation`/compressed `data`) into `Operations` via `PgOperationsBuilder` and executes them through `ExecuteSyncWithRetry`. It is simpler than the DynamoDB adapter (no stream-event marshalling, no `event-handler-aws` handler abstraction — `createPgToOpenSearchHandler` is a plain async function) but shares the exact same defect: the `Timer` it registers for the shared retry mechanism is hardcoded and never reflects real elapsed/remaining time.

## Public API

- `createPgToOpenSearchHandler` (`src/createPgToOpenSearchHandler.ts:14`) — the main export; returns a function taking `PgWalChangeRecord[]`. Codegraph: 2 callers, both internal to the package's own `src/index.ts`; the resulting handler is consumed by test setup in `packages/api-headless-cms-pg-os/__tests__/__api__/setupFile.js` (no other production caller found in this pass — `api-headless-cms-pg-os` is the one real downstream consumer package per the level's dependency list).
- `PgToOpenSearchFeature`/`PgToOpenSearchFeatureConfig` (`src/features/PgToOpenSearchFeature.ts:15`) — re-exported from `src/index.ts` but, per codegraph, only referenced from within this package (`createPgToOpenSearchHandler.ts` and the barrel itself); no external package currently imports it directly.
- `PgWalChangeRecord`/`PgWalChangeRecordData` (`src/types.ts`) — the record shape contract with whatever produces WAL change records upstream; re-exported from the barrel.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/createPgToOpenSearchHandler.ts:10,17-21` | Same defect as its DynamoDB sibling: `TimerFeature` is registered with a constant `getRemainingSeconds: () => MAX_RUNNING_TIME` (900, never decreasing), so `ExecuteSyncWithRetry`'s "abort if remaining time < 120s" safety check (`packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/ExecuteSyncWithRetry.ts:52`) can never trigger. | A long-running batch of failing OpenSearch bulk writes will keep retrying up to the full `retries`/`maxRetryTime` budget regardless of the actual Lambda invocation's remaining time, instead of exiting early via `NotEnoughRemainingTimeError`, risking a hard runtime timeout mid-retry. | high |

## Duplication

- No jscpd report was generated for this package (no clones detected / below jscpd's size threshold).
- Cross-package duplication with `@webiny/api-sync-ddb-to-opensearch`: the `MAX_RUNNING_TIME = 900` constant plus the identical `TimerFeature.register(...)` call (`src/createPgToOpenSearchHandler.ts:10,17-21`) is duplicated from `packages/api-sync-ddb-to-opensearch/src/createDdbToOpenSearchStreamHandler.ts:12,22-25`, and, as in that package, the duplication carried the bug (finding #1) along with it. The `PgOperationsBuilder`/`DdbOperationsBuilder` validate-decompress-insert-or-delete loop shape is also structurally similar between the two packages but operates on different record shapes, so merging them further isn't warranted beyond the shared `OperationsBuilder`/`Operations` abstractions already in place.

## Dead code

- `PgToOpenSearchFeature`/`PgToOpenSearchFeatureConfig` (`src/features/PgToOpenSearchFeature.ts:15`, re-exported at `src/index.ts:6-9`) — codegraph shows no consumers outside this package. This may be intentional public surface for downstream custom composition (matching the pattern in `DdbToOpenSearchFeature`, which is deliberately *not* exported by the DDB sibling), but as it stands it is unused outside the package; worth confirming intent.

## Convention issues

- Minor barrel-export inconsistency relative to the sibling package: `api-sync-ddb-to-opensearch` deliberately keeps its `DdbToOpenSearchFeature`/DI wiring out of its barrel (only exporting the handler factory), while this package exports `PgToOpenSearchFeature` publicly even though nothing outside the package uses it (see Dead code above). Given the "minimal barrel exports" convention, this should either be dropped from the barrel or its intended external use should be documented.
- Otherwise DI naming and one-abstraction-per-file conventions are followed correctly (`PgOperationsBuilder.ts` names its impl/export after the class, `feature.ts` per abstraction).

## Test gaps

- `__tests__/PgOperationsBuilder.test.ts` covers insert, delete, missing-id, missing-index, missing-data-on-insert, and a mixed insert+delete batch — good coverage of the builder in isolation.
- There is no test at all for `createPgToOpenSearchHandler` itself (the function that resolves `OperationsBuilder`/`ExecuteSyncWithRetry` and drives the retry-execute flow) — unlike the DynamoDB sibling, which has `event.test.ts` and `transfer.test.ts` exercising the equivalent handler through `DynamoDBEventHandler`. The `operations.total === 0` short-circuit (`createPgToOpenSearchHandler.ts:31-33`) and the call into `executeSyncWithRetry.execute` are therefore untested at this package's level.

## Recommendations

1. Fix finding #1 the same way as recommended for `api-sync-ddb-to-opensearch`: inject a real remaining-time source into `createPgToOpenSearchHandler` rather than hardcoding `MAX_RUNNING_TIME` into the `Timer` feature, ideally by extracting one shared, correctly-wired Timer helper both sync adapters consume.
2. Add a handler-level test for `createPgToOpenSearchHandler` (empty batch, single insert reaching a mocked/test OpenSearch client, and a failing bulk write reaching `ExecuteSyncWithRetry`) to match the coverage the DynamoDB sibling has.
3. Decide whether `PgToOpenSearchFeature` is meant to be public API; if not, drop it from `src/index.ts` to align with the minimal-barrel-exports convention already followed by the DynamoDB sibling.
