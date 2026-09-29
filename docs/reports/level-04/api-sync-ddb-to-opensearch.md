# @webiny/api-sync-ddb-to-opensearch

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-sync-ddb-to-opensearch` is the DynamoDB Streams adapter of Webiny's "sync to OpenSearch" system: it turns a batch of `DynamoDBStreamEvent` records into `@webiny/api-sync-to-opensearch`'s `Operations` (via `DdbOperationsBuilder`, which unmarshalls each record's keys/new-old images and decompresses the stored payload) and hands them to `ExecuteSyncWithRetry` through a small DI wiring (`DdbToOpenSearchFeature`) exposed as a single Lambda-ready factory, `createDdbToOpenSearchStreamHandler`. It correctly reuses `api-opensearch`'s client/health-check plumbing and `api-sync-to-opensearch`'s bulk/retry machinery rather than reimplementing them. The package is small and reasonably well tested for the happy path, but it wires the shared retry mechanism's timeout-awareness with a hardcoded constant that defeats its "abort if running out of time" safety check — the same defect exists verbatim in its Postgres sibling package.

## Public API

- `createDdbToOpenSearchStreamHandler` (`src/createDdbToOpenSearchStreamHandler.ts:12`) — the sole barrel export (`src/index.ts:1`); builds the DI container and returns a `DynamoDBStreamEvent` handler function. Codegraph: 3 callers/consumers — the package's own `src/index.ts`, the production Lambda entry point `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`, and the test setup in `packages/api-headless-cms-ddb-es/__tests__/__api__/setupFile.js`.
- `marshall`/`unmarshall` (`src/marshall.ts:13,20`) — thin wrappers around `@webiny/aws-sdk`'s DynamoDB marshalling; used only internally (by `DdbOperationsBuilder` and the package's own tests), not re-exported from the barrel.
- Everything else (`DdbOperationsBuilder`, `DdbToOpenSearchHandler`, `DdbToOpenSearchFeature` and their `feature.ts` registration files) is internal DI wiring, correctly kept out of `src/index.ts` per the monorepo's minimal-barrel-export convention.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/createDdbToOpenSearchStreamHandler.ts:22-25` | `TimerFeature` is registered with `getRemainingSeconds: () => 900` — a constant that never decreases across the invocation or across retry attempts — but `ExecuteSyncWithRetry`'s `onFailedAttempt` handler (`packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/ExecuteSyncWithRetry.ts:52`) relies on `timer.getRemainingSeconds() < 120` to decide whether to abort retrying and raise `NotEnoughRemainingTimeError`. Since the value is always 900, that check can never fire. | On a real Lambda deployment (the only real caller, `project-aws`'s `coreDdbToEsHandler`), if OpenSearch bulk writes keep failing, the handler will keep retrying for up to the configured `retries`/`maxRetryTime` window regardless of how much of the actual Lambda invocation time is left, instead of bailing out early with a clean `NotEnoughRemainingTimeError`. The invocation can be hard-killed by the Lambda runtime mid-retry rather than exiting gracefully, and the batch is redelivered by the DynamoDB Streams event source, compounding load during an outage. The code comment at line 18-20 acknowledges this is "existing behavior" but the factory offers no way for a caller to supply a real timer. | high |
| 2 | low | `src/features/DdbOperationsBuilder/DdbOperationsBuilder.ts:68` | When a `NewImage` is present but has no `index` field, the code does `console.log({ newImage })` before skipping the record, logging the full un-decompressed record (which can contain arbitrary user/entity data) to CloudWatch. | Any malformed or unexpected stream record with content but no `index` field causes potentially sensitive entity data to be written to logs. | medium |

## Duplication

- No intra-package clones (jscpd report for this package shows 0 clones).
- Cross-package duplication with `@webiny/api-sync-pg-to-opensearch` (its sibling adapter): the `MAX_RUNNING_TIME = 900` constant and the `TimerFeature.register(container, { getRemainingSeconds: () => 900, getRemainingMilliseconds: () => 900 * 1000 })` boilerplate (`src/createDdbToOpenSearchStreamHandler.ts:12,22-25`) is duplicated near-verbatim in `packages/api-sync-pg-to-opensearch/src/createPgToOpenSearchHandler.ts:10,17-21`. Since both copies share the same defect (finding #1), this is a case where the duplication also duplicated the bug — a real Lambda-aware `Timer` implementation belongs in one shared place (e.g. `api-sync-to-opensearch` or a small `event-handler-aws` helper) rather than being copy-pasted per adapter.
- The record-validation/decompress/insert-or-delete loop shape in `DdbOperationsBuilder.build` is structurally similar to `PgOperationsBuilder.build` in the sibling package, but the two operate on different record shapes (DynamoDB stream records with marshalled keys/images vs. flat WAL-change records) and aren't good candidates for merging beyond what `OperationsBuilder`/`Operations` already share.

## Dead code

None found with clear evidence — all internal features are wired into `DdbToOpenSearchFeature` and consumed by the handler chain; `marshall`/`unmarshall` are used by both source and tests.

## Convention issues

None found. DI naming (impl file named after the class, export name matching the abstraction, `feature.ts` per abstraction) and the minimal-barrel-export rule are both followed correctly.

## Test gaps

- `__tests__/DdbOperationsBuilder` behaviour is well covered (insert, delete, skip-on-missing-keys, skip-on-ignore, skip-on-empty-image, skip-on-missing-index for insert). However, the "skip delete when `OldImage` has no index" path (`DdbOperationsBuilder.ts:86-88`) is exercised without ever asserting that anything was logged, and there is no test for a decompression failure returning `null`/`undefined` (the `console.error` branch at `DdbOperationsBuilder.ts:73-76`) — this branch is currently untested.
- `__tests__/event.test.ts` and `transfer.test.ts` only cover the empty-batch and single-successful-record paths through `DynamoDBEventHandler`; there is no test exercising a failed/retried bulk write (the `ExecuteSyncWithRetry` path) at this package's level, and the tests mock `TimerFeature` with the same hardcoded `900` value, so they would not have caught finding #1.
- No test with more than one record in a batch (mixed insert+delete in the same event), so batching behaviour across multiple records is unverified at this level.

## Recommendations

1. Fix finding #1: either accept an injectable `Timer`/remaining-time source in `createDdbToOpenSearchStreamHandler` and wire it from the real Lambda `context.getRemainingTimeInMillis()` in the `project-aws` template, or move a correct, reusable Lambda-context-aware Timer into a shared package so both sync adapters stop duplicating (and both stop being wrong).
2. Add a test for the decompression-failure and missing-old-image-index skip branches in `DdbOperationsBuilder`, and one multi-record batch test, to close the coverage gaps above.
3. Avoid logging full un-decompressed record contents (finding #2); log only the record's `eventID`/id, as is already done in the neighbouring `console.error` calls.
