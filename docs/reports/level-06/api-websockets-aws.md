# @webiny/api-websockets-aws

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-websockets-aws` is the AWS Lambda transport/storage variant of `@webiny/api-websockets`: a `WebSocketLambdaHandler` that authenticates the incoming API Gateway WebSocket event and drives the shared `WebsocketsRunner`, a DynamoDB-backed `ConnectionRegistry` implementation keyed by connection id with GSIs for identity- and tenant-scoped lookups, and an `AwsWebsocketsTransport` that posts messages back to clients via `ApiGatewayManagementApiClient`. The package is small and mostly a thin, correct binding of `@webiny/api-websockets`'s abstractions to AWS services. Health is otherwise good, but one security finding was confirmed here (see Bugs — full detail is the SEC-27 addendum in `docs/.reports/security.md`), and the package ships a zod-based `AwsWebsocketsEventValidator` that is never actually invoked by the real request path.

## Public API
- `WebSocketLambdaHandler` (`src/WebSocketLambdaHandler.ts:114`) — the Lambda `$connect`/`$disconnect`/`$default` entry point; registered by `WebsocketsAwsFeature` and consumed only within this package's own `src/index.ts` (codegraph: 1 caller).
- `WebsocketsDdbFeature` (`src/WebsocketsDdbFeature.ts:6`) — registers the DynamoDB `ConnectionRegistry` implementation; consumed by `packages/api-event-handler-aws-ddb/src/createWebinyApiHandler.ts` and `packages/api-event-handler-aws-ddb-os/src/createWebinyApiHandler.ts` (codegraph), i.e. both DDB-backed AWS project templates.
- `AwsWebsocketsTransport` (`src/transport/AwsWebsocketsTransport.ts:64`) — sends/disconnects via API Gateway Management API; consumed only from this package's own `src/index.ts`.
- `WebsocketsConnectionRegistry` (`src/WebsocketsConnectionRegistry.ts:11`) — exported from the barrel for custom DI wiring, but in practice only instantiated inside `WebsocketsDdbFeature`.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/api-websockets-aws/src/WebSocketLambdaHandler.ts` | Security finding SEC-27 — see private notes. | — | high |

## Duplication
No jscpd clones reported for this package. `toWebsocketsEvent`'s event/route-type mapping (`WebSocketLambdaHandler.ts:39-69`) duplicates the same three-way `WebsocketsEventRequestContextEventType`/`WebsocketsEventRoute` enum mapping that `AwsWebsocketsEventValidator.ts:6-16` also defines — the two mappings currently agree, but since the validator's copy is dead code (see below) there is a latent risk of the two definitions drifting if either is edited in isolation.

## Dead code
- `AwsWebsocketsEventValidator` (`src/validator/AwsWebsocketsEventValidator.ts:78`) implements `WebsocketsEventValidator.Interface` with a full zod schema for the incoming API Gateway WebSocket event, but it is never registered by `WebsocketsAwsFeature` and never referenced from `WebSocketLambdaHandler.ts`, which builds its `IWebsocketsEvent` directly via the hand-written `toWebsocketsEvent`/`getBody` helpers instead (codegraph: no consumers outside its own `__tests__/validator/AwsWebsocketsEventValidator.test.ts`). The actual runtime path therefore never runs this validator's stricter checks (e.g. requiring `token`/`tenant` as non-empty strings on `body`), only what `getEventValues`/`toWebsocketsEvent` happen to do.

## Convention issues
None found. Each file holds one abstraction/implementation (`WebSocketLambdaHandler`, `WebsocketsConnectionRegistry`, `AwsWebsocketsTransport`, `AwsWebsocketsEventValidator`), and DI naming (implementation classes suffixed `Impl`, exported const matching the abstraction name) follows AGENTS.md conventions.

## Test gaps
- `WebSocketLambdaHandler` has no tests (codegraph: no tests found within 3 caller hops); see also SEC-27 in private notes.
- `WebsocketsConnectionRegistry` (the DynamoDB registry) has no dedicated test file under `__tests__/`; only `AwsWebsocketsTransport` and the unused `AwsWebsocketsEventValidator` are tested.

## Recommendations
1. Address security finding SEC-27 (see private notes, `docs/.reports/security.md`).
2. Either wire `AwsWebsocketsEventValidator` into `WebSocketLambdaHandler` (replacing the ad hoc `toWebsocketsEvent`/`getBody` logic) or delete it — as-is it is unmaintained dead code that could mislead future readers into thinking incoming events are validated.
3. Add a test for `WebSocketLambdaHandler.execute` covering authentication, tenant resolution, and runner dispatch, and a basic round-trip test for `WebsocketsConnectionRegistry`.
