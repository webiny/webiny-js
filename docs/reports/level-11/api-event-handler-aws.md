# @webiny/api-event-handler-aws

> Level 11 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-aws` is the AWS Lambda composition root for the full Webiny API: it wires the API Gateway (buffered) and Function URL (response-streaming) transports from `@webiny/event-handler-aws`, adds the identity/tenant extraction decorators, registers every non-HTTP inbound invocation shape (background tasks, EventBridge, EventBridge Scheduler, WebSockets), and delegates the transport-agnostic per-request feature stack to `@webiny/api-event-handler-core`'s `registerApiRequestStack`. Storage (DynamoDB vs. DynamoDB+OpenSearch) is injected by thin variant packages (`api-event-handler-aws-ddb`, `-aws-ddb-os`) via `registerRootStorage`/`registerRequestStorage`, so this package itself is storage-agnostic. Overall health is good — the split between `composition/` (shared by the buffered and streaming handlers, so they cannot drift on storage/identity/feature-stack) and the per-transport `handlers/` decorators is deliberate and well documented — but one confirmed inconsistency was found in how the two HTTP decorator pairs (API Gateway vs. Function URL) extract the tenant id. (The already-known SEC-6 body-parsing finding lives in the lower-level `@webiny/event-handler-aws` transport package, not here, and is not re-reported.)

## Public API
- `createWebinyApiHandler` / `createWebinyStreamApiHandler` (`src/createWebinyApiHandler.ts:28`, `src/createWebinyStreamApiHandler.ts:32`) — the two Lambda entry-point factories. Consumed by the `api-event-handler-aws-ddb`/`-aws-ddb-os` variant packages, which are in turn the entry point every AWS-deployed Webiny project (via its generated Lambda handler) calls into.
- `registerInboundEventTypes` / `registerWebinyApiRoot` / `registerWebinyApiChild` / `WebinyApiCompositionConfig` (`src/composition/*.ts`) — the shared composition pieces re-exported for the variant packages to compose with their own storage config.
- Decorators and helpers re-exported from `src/handlers/index.ts` (`ApiGatewayIdentityLoaderDecorator`, `ApiGatewayTenantLoaderDecorator`, `FunctionUrlStream*LoaderDecorator`, `S3TenantLoaderDecorator`, `extractRequestAuth` helpers) — mostly consumed internally by this package's own two composition roots; `S3TenantLoaderDecorator` additionally has an external consumer (an S3-event tenant-extraction path used by a downstream package's file-processing pipeline).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `src/handlers/ApiGatewayTenantLoaderDecorator.ts:27` | Reads the tenant header with an inline exact-casing check (`headers["x-tenant"] ?? headers["X-Tenant"] ?? null`) instead of the shared, fully case-insensitive `extractTenantId()` helper already defined in the same package (`src/handlers/extractRequestAuth.ts:56`, which loops over header keys and lower-cases each one). Its own sibling, `FunctionUrlStreamTenantLoaderDecorator.ts:28`, does use `extractTenantId()`. | A caller that sends the tenant header in any casing other than exactly `x-tenant` or `X-Tenant` (e.g. `X-TENANT`, `x-Tenant`) is silently treated as having sent no tenant header at all through API Gateway (falls back to the "root" tenant via `RequestTenantLoader`), while the identical request through the Function URL/streaming path would resolve the tenant correctly. This is a functional inconsistency between the two AWS transports for the exact same conceptual header, not merely a style nit. | high |

## Duplication
No clones within the package (jscpd: 0). `ApiGatewayIdentityLoaderDecorator`/`FunctionUrlStreamIdentityLoaderDecorator` and `ApiGatewayTenantLoaderDecorator`/`FunctionUrlStreamTenantLoaderDecorator` are near-identical by design (same EXTRACT→LOAD pattern per the file comments), sharing the actual header-parsing logic through `extractRequestAuth.ts` rather than duplicating it — this is the intended shape, not accidental duplication.

## Dead code
None found. Every exported symbol has at least one real consumer (internal composition roots, the variant packages, or — for `S3TenantLoaderDecorator` — a downstream package); codegraph confirms non-zero callers for the ones checked.

## Convention issues
None meaningful. DI naming, one-abstraction-per-file, and barrel-export conventions are all followed (each decorator/implementation is its own file, named for its class, and `src/index.ts` re-exports only the handler factories, config types, and the `handlers/` barrel).

## Test gaps
Only 2 of the ~15 non-index/type source files have direct tests (`S3TenantLoaderDecorator.test.ts`, `registerInboundEventTypes.test.ts`). Untested: `ApiGatewayIdentityLoaderDecorator`/`ApiGatewayTenantLoaderDecorator`/`FunctionUrlStreamIdentityLoaderDecorator`/`FunctionUrlStreamTenantLoaderDecorator` (so the casing inconsistency in Bug #1 was not caught by any test), `extractRequestAuth.ts`'s header/cookie parsing helpers, and both `createWebinyApiHandler`/`createWebinyStreamApiHandler` factory functions themselves (only exercised end-to-end via the `api-event-handler-aws-ddb` variant's `freshInstall.test.ts`).

## Recommendations
1. Fix `ApiGatewayTenantLoaderDecorator.ts:27` to call the shared `extractTenantId()` helper instead of its own inline two-casing check, so API Gateway and Function URL agree on tenant extraction (Bug #1).
2. Add unit tests for the four identity/tenant decorators (mirroring the existing `S3TenantLoaderDecorator.test.ts` pattern) — cheap to write given the existing test harness, and would have caught Bug #1 directly.
3. Add a focused test for `createWebinyApiHandler`/`createWebinyStreamApiHandler` asserting that the buffered handler registers `registerInboundEventTypes` (background tasks, EventBridge, scheduler, WebSockets) while the streaming handler deliberately does not — the current guarantee lives only in a code comment.
