# @webiny/event-handler-aws

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/event-handler-aws` is the AWS Lambda transport for `@webiny/event-handler-core`'s DI handler chain: it binds the raw Lambda event/context (and, for response streaming, the raw response stream) into the per-request container, translates API Gateway/Function URL events into the shared `IHttpRequest`/`IHttpResponse` shape, and provides `EventType`/handler abstractions for every other Lambda trigger Webiny uses (SQS, SNS, S3, DynamoDB Streams, EventBridge, WebSocket, Step Functions "background task", and a scheduled-action convention). It is the composition root every AWS-deployed Webiny API package (`api-event-handler-aws` and everything built on it — GraphQL, headless CMS, page/form builder, sync system, etc.) goes through, via `createLambdaHandler`/`createStreamLambdaHandler`. The package is well-designed and its trigger-detection/streaming edge cases are documented carefully (e.g. the deliberate `ApiGatewayEventType`/`FunctionUrlStreamEventType` payload-shape collision, the lazy-prelude gotcha in response streaming). Overall health is good; the notable issues found are a correctness bug in the API Gateway body decoder (no `isBase64Encoded` handling, unlike its Function-URL sibling) plus one security finding (see Bugs table, row 3).

## Public API
- `createLambdaHandler`/`createStreamLambdaHandler` (`src/createLambdaHandler.ts:16`, `src/createStreamLambdaHandler.ts:33`) — the platform entry points. Consumed by `packages/api-event-handler-aws/src/createWebinyApiHandler.ts` and `createWebinyStreamApiHandler.ts`, i.e. every AWS Lambda API composition root in the monorepo.
- `awsLambdaTransport`/`awsLambdaStreamTransport` (`src/AwsLambdaTransport.ts:17`, `src/AwsLambdaStreamTransport.ts:21`) — bind the Lambda event/context/response-stream into the request container; used internally by the two handler factories above.
- `apiGatewayEventToHttpRequest`/`functionUrlEventToHttpRequest`/`httpResponseToApiGatewayResult` (`src/translators/*.ts`) — the HTTP translators, each with one internal caller (`ApiGatewayHttpRouterHandler`, `FunctionUrlStreamRouterHandler`) but exported for reuse/testing.
- `ApiGatewayFeature`/`S3Feature`/`FunctionUrlStreamFeature` (`src/features/*.ts`) — DI feature registrations composed by `api-event-handler-aws` and other API packages to wire up transport-only infra (event type + terminal handler) per trigger.
- The `eventTypes`/`abstractions/handlers` barrel (SQS/SNS/S3/DynamoDB/EventBridge/WebSocket/ScheduledAction/BackgroundTask/ApiGateway/FunctionUrlStream) — extension points other packages decorate to add their own domain handlers (e.g. `api-sync-system` registers a `DynamoDBEventHandler`).
- `AwsLambdaContext`/`AwsLambdaEvent`/`LambdaResponseStream` abstractions — resolved by downstream decorators (auth/tenant loaders in `api-event-handler-aws`) that need the raw Lambda context/event/stream.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/event-handler-aws/src/translators/apiGatewayEventToHttpRequest.ts:13-21` | Unlike its sibling `functionUrlEventToHttpRequest` (which checks `event.isBase64Encoded` and decodes accordingly), `apiGatewayEventToHttpRequest` calls `JSON.parse(event.body)` directly with no `isBase64Encoded` check at all — API Gateway base64-encodes the body whenever the request's content type isn't in the configured `binaryMediaTypes` allowlist (or for any genuinely binary payload). | Any request through the REST/HTTP-API-Gateway path whose body API Gateway decides to base64-encode (binary uploads, or any content type not on the binary allowlist) arrives with `event.isBase64Encoded === true` and a base64 string in `event.body`. This translator ignores that flag, tries to `JSON.parse` the base64 text (fails), and falls back to handing the route the raw base64 string as `body` instead of the decoded payload — silently corrupting the request for every handler that reads `request.body`. | high |
| 2 | low | `packages/event-handler-aws/src/abstractions/AWS_LAMBDA_ABSTRACTIONS.md:7,128,135,138` | This stray doc file (co-located with the abstractions, not part of any build output) describes the abstractions as being "automatically registered by `createFunction`", an API that does not exist anywhere in this package (the actual entry points are `createLambdaHandler`/`createStreamLambdaHandler`, which bind the transport, not a `createFunction`). | Anyone reading this doc to understand how to use `AwsLambdaContext`/`AwsLambdaEvent` gets a wrong mental model of the wiring; low impact since it's documentation only, not code, but worth fixing or removing since it predates the DI-native rewrite. | high |
| 3 | medium | `packages/event-handler-aws/src/translators/apiGatewayEventToHttpRequest.ts` | Security finding SEC-6 — see private notes. | — | medium |

## Duplication
jscpd found no internal clones in this package (`jscpd-event-handler-aws/jscpd-report.json` reports 0 duplicates). No cross-package reimplementation of lower-level utilities was found: the package correctly delegates to `@webiny/event-handler-core`'s `HandlerApp`/`HttpRouter`/`HttpStreamBody` rather than reimplementing routing or streaming, and to `@webiny/feature`'s `createFeature` for its DI feature registrations.

## Dead code
- `apiGatewayHelpers` (`src/utils/apiGatewayHelpers.ts:6`) — a small `success`/`error` response-builder object. It is not re-exported from `src/index.ts` and has zero consumers anywhere in the monorepo outside its own compiled `dist/` output (codegraph/grep: no consumers). Every real route in the codebase goes through `HttpRouter`/`HttpResponseBuilder` instead. Safe to delete.

## Convention issues
The package otherwise follows the repo's DI conventions well: one abstraction/implementation per file (e.g. each `abstractions/handlers/*EventHandler.ts`), implementation classes named `<Name>Impl` with the exported implementation matching the abstraction name, and namespace-scoped `Interface` types throughout. The only issue is the stale `AWS_LAMBDA_ABSTRACTIONS.md` doc noted above (Bug #2), which documents a pre-rewrite API surface (`createFunction`) that no longer exists in this package.

## Test gaps
- No test exercises `isBase64Encoded`/binary bodies for the API Gateway path at all (Bug #1 above), even though the Function URL translator's equivalent branch is directly tested in `functionUrlEventToHttpRequest.test.ts` — the asymmetry itself would have been caught by a matching test.
- `WebSocketEventType`, `ScheduledActionEventType`, and `BackgroundTaskEventType`'s `canHandle` discriminators have no unit tests (only `ApiGatewayEventType`, `S3EventType`, `SqsEventType`, `SnsEventType`, `EventBridgeEventType`, and `DynamoDBEventType` are covered in `eventTypes.test.ts`).
- `drainStreamBody`'s content-type-based text/binary branching (`translators/drainStreamBody.ts`) has no direct test; it's only exercised indirectly through `httpResponseToApiGatewayResult.test.ts`'s Buffer-response case.
- The stage-prefix-stripping logic in `apiGatewayEventToHttpRequest` (named-stage vs. `$default`, v1 vs. v2 payload) has no dedicated test for the named-stage-stripping branch.

## Recommendations
1. Fix `apiGatewayEventToHttpRequest` to check `event.isBase64Encoded` and decode the body the same way `functionUrlEventToHttpRequest` already does, then add a test mirroring `functionUrlEventToHttpRequest.test.ts`'s binary-body case for the API Gateway path (Bug #1).
2. Address the finding flagged in row 3 of the Bugs table (see private security notes).
3. Delete the dead `apiGatewayHelpers` utility and the stale `AWS_LAMBDA_ABSTRACTIONS.md` doc (or rewrite the doc to describe the current `createLambdaHandler`/transport wiring instead of the nonexistent `createFunction`).
