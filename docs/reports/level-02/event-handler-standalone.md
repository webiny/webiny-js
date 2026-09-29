# @webiny/event-handler-standalone

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/event-handler-standalone` is the plain Node.js `http.Server` transport for `@webiny/event-handler-core`'s DI handler chain: it translates a raw `IncomingMessage` into the shared `IHttpRequest`, dispatches it through the shared `HttpRouter`, and writes the resulting `IHttpResponse` back out, including chunk-by-chunk streaming with correct back-pressure handling for `HttpStreamBody` responses. It is the composition root that `@webiny/api-event-handler-standalone` uses to run the whole Webiny API as a self-hosted server (as opposed to AWS Lambda). The design mirrors the AWS transport package closely and the streaming path is well tested, but the request-body reader has no size limit, which is a real resource-exhaustion risk for a package whose whole purpose is to sit directly in front of untrusted traffic.

## Public API
- `createServerHandler` (`packages/event-handler-standalone/src/createServerHandler.ts:18`) — builds the `HandlerApp` and the Node HTTP server. Consumed by `packages/api-event-handler-standalone/src/createWebinyApiHandler.ts` (the standalone server composition root) and by this package's own streaming tests.
- `NodeHttpFeature` (`packages/event-handler-standalone/src/features/NodeHttpFeature.ts:17`) — registers the transport-only infra (event type, `HttpFeature`, terminal router handler). Same consumer as above.
- `NodeHttpEventHandler` abstraction and `NodeHttpRouterHandler` implementation (`packages/event-handler-standalone/src/abstractions/NodeHttpEventHandler.ts:12`, `packages/event-handler-standalone/src/handlers/NodeHttpRouterHandler.ts:40`) — extension points for transport decorators (e.g. auth/tenant loaders added in `api-event-handler-standalone`), mirroring the AWS package's `ApiGatewayEventHandler` pattern.
- `nodeHttpRequestFromIncomingMessage` (`packages/event-handler-standalone/src/translators/NodeHttpTranslator.ts:57`) — re-exported from the package barrel but currently only consumed internally by `NodeHttpRouterHandler`; no external package imports it (codegraph: only the one internal caller).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/event-handler-standalone/src/translators/NodeHttpTranslator.ts` | Security finding — see private notes. | — | high |

## Duplication
No jscpd clones reported for this package. The response-writing split (`writeHttpResponse`/`writeBufferedBody`/`writeStreamBody`/`writeErrorResponse`) intentionally mirrors the equivalent AWS transport's response translation (per the code comments referencing `ApiGatewayHttpRouterHandler`); that's parallel architecture across two transport packages rather than a copy-paste clone, and each file is small and does one job, so it's not something to consolidate.

## Dead code
None found with high confidence. `nodeHttpRequestFromIncomingMessage` has only one internal caller today (codegraph: no external consumers), but it is a small, clearly-scoped public re-export (a translator function) that a custom transport composition could reasonably need, so this reads as an intentional extension point rather than dead code.

## Convention issues
None found. Files are one-class-per-file, abstractions/implementations follow the DI naming convention (`NodeHttpEventHandler`/`NodeHttpEventType`/`NodeHttpRouterHandler` each define their interface, `Interface` namespace type, and `Impl` class in the expected shape), and the barrel (`index.ts`) only exports what other packages need.

## Test gaps
The single test file (`__tests__/streaming.test.ts`) is a thorough suite for the streaming/back-pressure/empty-stream/mid-stream-failure paths, but there is no coverage at all for: `NodeHttpTranslator`'s body-parsing branches (JSON vs. text vs. binary decoding based on `Content-Type`, and the JSON-parse-failure fallback to raw text at `NodeHttpTranslator.ts:20-26`), query-string parsing (`parseQuery`), the 404 (`RouteNotFoundError`) and 500/WebinyError branches in `NodeHttpRouterHandlerImpl.execute`, or `writeErrorResponse`'s `headersSent` branch. These are the core request/response translation paths exercised on every single request in standalone deployments.

## Recommendations
1. Address security finding SEC-3 (see private security notes, `docs/.reports/security.md`).
2. Add unit tests for `NodeHttpTranslator`'s content-type-driven body decoding and for `NodeHttpRouterHandlerImpl`'s 404/500 error-mapping branches — currently the only test file covers streaming, leaving the everyday request-translation and error-response paths unverified.
3. No structural or duplication issues found; the package is small, well-scoped, and consistent with the AWS transport package's design — no refactor needed beyond the two items above.
