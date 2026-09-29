# @webiny/api-opensearch-aws

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-opensearch-aws` is a thin, AWS-specific adapter on top of `@webiny/api-opensearch`: it builds an OpenSearch client signed with AWS SigV4 credentials (falling back to `@webiny/api-opensearch`'s plain client when explicit `auth` options are given), registers that client as the DI-resolvable `OpenSearchClientFactory`, wraps `@webiny/db-dynamodb`'s `createTable`/`createEntity` with the fixed attribute shape used by the "DynamoDB → OpenSearch" streaming table, and ships a `testing/` helper (`simulateStream`) that lets other packages' test suites simulate DynamoDB Streams events from a mocked `DynamoDBDocument.send`. The package is tiny (6 source files, ~280 lines), has zero jscpd clones, and no bugs were found in the production code paths; its one weak spot is a small correctness issue in the test-only stream simulator and the complete absence of the package's own automated tests.

## Public API

- `createAwsOpenSearchClient` (`src/createAwsOpenSearchClient.ts:9`) — builds an AWS-SigV4-signed OpenSearch client (or delegates to `@webiny/api-opensearch`'s `createOpenSearchClient` if `options.auth` is already set). ~6 consumers via codegraph, e.g. `api-event-handler-aws-ddb-os`'s `createWebinyApiHandler`, `AwsOpenSearchClientFactory` (below), and the `project-aws` extension templates.
- `AwsOpenSearchClientFactoryFeature` / `AwsOpenSearchClientFactory` (`src/features/AwsOpenSearchClientFactory/*`) — the DI feature that registers `createAwsOpenSearchClient` as the app's `OpenSearchClientFactory` implementation; consumed by `api-event-handler-aws-ddb-os`.
- `createOpenSearchTable` / `createOpenSearchEntity` (`src/db/table.ts`, `src/db/entity.ts`) — thin wrappers around `@webiny/db-dynamodb`'s `createTable`/`createEntity` with the OpenSearch-stream table's fixed `GSI_TENANT` index and `index` attribute. ~4-6 consumers each, e.g. `api-headless-cms-ddb-es`'s `feature.ts` and `api-search-index-tasks-ddb-os`'s `StorageWriter`/`StorageScanner`.
- `simulateStream` (`src/testing/index.ts` → `src/testing/simulateStream.ts`) — patches a `DynamoDBDocument`'s `send` to also synthesize a matching DynamoDB Streams event and hand it to a supplied handler; used by `api-headless-cms-ddb-es`'s test setup file to exercise the DDB→OpenSearch stream handler without a real stream.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `packages/api-opensearch-aws/src/testing/simulateStream.ts:21` | `throw new Error(\`Error processing "${name}" command: ${ex.message}\`, ex)` passes the original error as a raw second positional argument to the native `Error` constructor, not as `{ cause: ex }`. Node's `Error` constructor only recognizes an options object there, so the original exception (and its stack) is silently dropped from the thrown error. | When a test using `simulateStream` fails inside `processing[name]` (e.g. a malformed DynamoDB command), the resulting test failure message loses the original error's stack trace, making the underlying cause harder to diagnose — a test-debugging annoyance, not a production defect. | high |

## Duplication

None found. jscpd reports zero clones within the package, and no other package in the monorepo uses `AwsSigv4Signer` (grep-confirmed), so `createAwsOpenSearchClient`'s credential-signing logic is not duplicated elsewhere.

## Dead code

None found. Every exported symbol (`createAwsOpenSearchClient`, `AwsOpenSearchClientFactoryFeature`, `createOpenSearchTable`, `createOpenSearchEntity`, `simulateStream`, `createDynamoStreamEvent`/`createDynamoStreamRecord`) has at least one confirmed external consumer per codegraph.

## Convention issues

None found. The package is organized one-abstraction-per-file (`AwsOpenSearchClientFactory.ts` + `feature.ts`), types are named interfaces rather than inline object types (`ICreateOpenSearchTableParams`, `ICreateOpenSearchEntityParams`), and `src/index.ts` only re-exports the feature/db helpers actually consumed elsewhere (the `testing/` and internal `createAwsOpenSearchClient` re-export are the only slightly broader surface, which is reasonable for a package whose whole purpose is to be a thin adapter).

## Test gaps

- The package has no `__tests__` directory at all — none of `createAwsOpenSearchClient`'s two code paths (SigV4-signed vs. passthrough when `options.auth` is set), the missing-`AWS_REGION`/missing-credentials error branches, `AwsOpenSearchClientFactoryImpl`'s endpoint/node validation, or `createOpenSearchTable`/`createOpenSearchEntity`'s attribute wiring are exercised directly in this package. Coverage instead comes indirectly, through downstream packages' test suites that happen to call these functions.
- `simulateStream`'s own command-routing logic (`processPut`/`processDelete`/`processBatchWrite`, `getCommandName`) has no dedicated unit test in this package; its correctness is only implicitly checked by whatever assertions the consuming package's tests happen to make.

## Recommendations

1. Add a small `__tests__` suite covering `createAwsOpenSearchClient`'s branches (SigV4 path, passthrough path, missing `AWS_REGION`, missing credentials) and `AwsOpenSearchClientFactoryImpl`'s endpoint/node validation error — currently a regression here would only surface as a failure in an unrelated downstream package.
2. Fix the `Error(message, ex)` call in `simulateStream.ts:21` to `new Error(message, { cause: ex })` so the original exception isn't lost from stream-simulation test failures.
3. Given the package has no tests of its own, add at least one direct test for `simulateStream`'s `processBatchWrite` (the most complex of the four handlers, with its own thrown-error branches for missing records/index values) rather than relying solely on indirect coverage via `api-headless-cms-ddb-es`.
