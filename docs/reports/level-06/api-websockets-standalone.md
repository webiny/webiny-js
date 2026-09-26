# @webiny/api-websockets-standalone

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-websockets-standalone` is the self-hosted/Node transport variant of `@webiny/api-websockets`: an HTTP-upgrade-driven `WebsocketsServer` (built on the `ws` package via `NodeWsAdapter`) that authenticates a connection's token, registers it with a shared `ServerConnectionManager`, keeps it alive with a `HeartbeatManager`, and a `ServerWebsocketsTransport` that pushes server→client messages through the in-memory socket map. Unlike `api-websockets-aws`, this variant does **not** route through `@webiny/api-websockets`'s `WebsocketsRunner`/route-handler chain at all: connect and disconnect are reimplemented directly in `WebsocketsServer`/`ServerConnectionManager`, and incoming client messages are not dispatched to any route handler — the `onMessage` handler only validates JSON and refreshes `lastSeen`. It shares security finding SEC-27 with `api-websockets-aws` (see private notes).

## Public API
- `createWebsocketsServer`/`attachWebsocketsServer` (`src/server/WebsocketsServer.ts:291,308`) — the two ways to start the server (owning its own `http.Server` vs. attaching to an existing one); consumed by `packages/api-event-handler-standalone/src/createWebinyApiHandler.ts` (the standalone project's composition root) and this package's own `src/index.ts`.
- `ServerConnectionManager` (`src/connectionManager/ServerConnectionManager.ts:80`) — the shared in-memory + registry-backed connection manager; same two consumers (codegraph), with no tests found within 3 caller hops for the DI-wired path.
- `WebsocketsStandaloneFeature` (`src/WebsocketsStandaloneFeature.ts:10`) — registers `ServerWebsocketsTransport` into the per-request container; consumed by the standalone handler for server→client sends triggered from GraphQL resolvers/use cases.
- `NodeWsAdapter`, `DefaultUpgradeHandler` — swappable low-level pieces (socket library, upgrade gate), exported for custom wiring but used only with their default implementations in the shipped handler.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/api-websockets-standalone/src/server/WebsocketsServer.ts` | Security finding SEC-27 — see private notes. | — | high |
| 2 | medium | `packages/api-websockets-standalone/src/server/WebsocketsServer.ts:170-187` | The `onMessage` handler for an established connection only JSON-validates the payload and calls `connectionManager.updateLastSeen(connectionId)`; it never dispatches the message to `@webiny/api-websockets`'s `WebsocketsRunner`/route-handler chain (the `default`/custom-action route that `api-websockets-aws`'s `WebSocketLambdaHandler` does run for every event type). The package's own `ServerWebsocketsEventValidator` (`src/validator/ServerWebsocketsEventValidator.ts`), which maps a message's `body.action` to a custom route, is built and tested but never constructed or wired into `WebsocketsServer`. | Any first-party feature built on `@webiny/api-websockets`'s route-handler abstraction to react to client-sent "action" messages (the `default` route) works when deployed on AWS but silently does nothing when deployed on the self-hosted standalone transport — the client's message is accepted (connection stays open, `lastSeen` updates) but produces no response and triggers no handler, with no error surfaced anywhere. | medium |

## Duplication
jscpd flagged one internal clone: `packages/api-websockets-standalone/src/transport/ServerWebsocketsTransport.ts:42-51` duplicates `:21-30` — `send()`'s and `disconnect()`'s identical "look up socket, remove if missing, else adapter call wrapped in try/catch that logs and swallows" bodies. This is the same shape `AwsWebsocketsTransport.send`/`disconnect` uses in `api-websockets-aws` (both wrap the AWS SDK call in a per-connection try/catch that only logs), so the duplication is consistent across both transports rather than a one-off; a shared `forEachConnection(connections, fn)` helper in `@webiny/api-websockets` could remove both copies at once.

## Dead code
- `ServerWebsocketsEventValidator` (`src/validator/ServerWebsocketsEventValidator.ts:46`) is fully implemented and unit-tested (`__tests__/validator/ServerWebsocketsEventValidator.test.ts`) but is never imported by `WebsocketsServer.ts`, never exported from `src/index.ts`, and never registered by `WebsocketsStandaloneFeature` (codegraph: no consumers outside its own test). It is the mechanism that would let `body.action` select a custom route — see Bugs #2.

## Convention issues
None found. Files follow one-abstraction-per-file (`WebsocketsServer`, `ServerConnectionManager`, `HeartbeatManager`, each adapter/handler in its own file), and DI abstractions (`WebsocketsConnectionManager`, `WebsocketsServerAdapter`, `WebsocketsUpgradeHandler`) use the namespace-type pattern from AGENTS.md.

## Test gaps
- No test exercises the actual `registerConnection` tenant/identity flow end-to-end (i.e. what tenant a connection ends up registered under given a specific `?tenant`/`?token` pair) — `__tests__/server/WebsocketsServer.test.ts` and `__tests__/connectionManager/ServerConnectionManager.test.ts` exist, but codegraph shows no tests reachable within 3 hops of the DI-registered `ServerConnectionManager`/`WebsocketsStandaloneFeature` composition used by the real handler.
- No test covers what happens to a "message"/`default`-route event once it reaches `WebsocketsServer` (i.e. that it is currently a no-op) — this would have caught Bugs #2.

## Recommendations
1. Address security finding SEC-27 (see private notes, `docs/.reports/security.md`).
2. Decide whether standalone deployments are meant to support the `default`/custom-action route: either wire `ServerWebsocketsEventValidator` + `WebsocketsRunner` into `onMessage` so the two transports behave the same, or explicitly document/reject the gap so consumers don't build a feature that silently only works on AWS.
3. Extract the shared "iterate connections, look up socket, remove-if-missing, try/catch-and-log" pattern out of `ServerWebsocketsTransport` (and, ideally, `AwsWebsocketsTransport`) into `@webiny/api-websockets` to remove the jscpd-flagged duplication and its AWS-side twin.
