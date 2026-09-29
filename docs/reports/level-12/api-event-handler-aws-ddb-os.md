# @webiny/api-event-handler-aws-ddb-os

> Level 12 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-aws-ddb-os` is the DynamoDB+OpenSearch storage variant over `@webiny/api-event-handler-aws`: like `api-event-handler-aws-ddb`, it supplies `registerRootStorage`, but additionally registers the full OpenSearch client/query-builder/field/index Feature set and a `registerRequestStorage` hook (`DbRegistryFeature`) that must run before the CMS storage builds. The buffered and streaming handler factories share one `storageConfig()` closure so the two Lambda functions built from the same bundle cannot drift on storage wiring — the same pattern used by the base AWS package for its own buffered/streaming split. Health is good; the package is small and config-only beyond that closure.

## Public API
- `createAwsDdbOsApiHandler` / `createAwsDdbOsStreamApiHandler` (`src/createWebinyApiHandler.ts:98`, `:106`) — the two Lambda handler factories for this storage variant; consumed by generated project code (outside this monorepo), analogous to the plain DDB variant.
- `CreateAwsDdbOsApiHandlerConfig` — adds an optional `openSearchClient` override (for pointing integration tests at a local OpenSearch) to the base config's `extensions`/`documentClient`.

## Bugs
None found with high confidence. One low-severity robustness note: `openSearchClientFromEnv()` (`src/createWebinyApiHandler.ts:39-55`) builds the endpoint as `` `https://${process.env.OPENSEARCH_ENDPOINT}` `` with no check that the env var is actually set — if it is missing, the client is constructed with the literal endpoint `https://undefined`, which will fail at first use with a DNS/connection error rather than a clear configuration error at startup. This is a deploy-time misconfiguration scenario (would be caught immediately in any environment that actually receives traffic) rather than a runtime data-safety bug, so it is not included in the table, but is worth a one-line guard.

## Duplication
N/A — jscpd reports 0 clones; the buffered/streaming duplication that would otherwise exist is avoided by the shared `storageConfig()` closure.

## Dead code
None found.

## Convention issues
None meaningful.

## Test gaps
This package has no `__tests__` directory (unlike its DynamoDB-only sibling, `api-event-handler-aws-ddb`, which has `freshInstall.test.ts`). There is no test that the handler boots successfully with the OpenSearch storage wiring, nor for the `registerRequestStorage`/`DbRegistryFeature` ordering the comments call out as required ("must be registered before HeadlessCmsFeature builds").

## Recommendations
1. Add a `freshInstall.test.ts`-equivalent smoke test (mirroring `api-event-handler-aws-ddb`'s) that boots this handler against a fresh DDB+OpenSearch setup, since this variant currently has zero test coverage.
2. Guard `openSearchClientFromEnv()` with an explicit check that `OPENSEARCH_ENDPOINT` is set, throwing a clear configuration error instead of constructing a client pointed at `https://undefined`.
3. No other changes needed — the storage wiring itself is correctly ordered and the buffered/streaming split is handled cleanly via the shared closure.
