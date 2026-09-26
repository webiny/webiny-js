# @webiny/api-websockets

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-websockets` is the transport-agnostic core of Webiny's websocket support: it defines the DI abstractions for connection registries, transports, and route handlers (`connect`/`disconnect`/`default`), the request runner that dispatches an incoming websocket event to the right route handler through a small middleware chain, a GraphQL schema (`listConnections`, `disconnect*`) for admin-side connection management, and use cases (`SendToConnections`, `SendToIdentity`, `Disconnect`) that concrete transports (e.g. `api-websockets-aws`) build on. The package is small, cleanly factored per the repo's DI/one-abstraction-per-file conventions, and has reasonable test coverage of the runner/middleware/registry contracts. Two security findings were identified (see Bugs — full details recorded privately). Stale-connection cleanup (`ConnectionRegistry.listStale`/`updateLastSeen`) is defined but never wired up; the interim workaround is a hardcoded 3-hour cutoff baked into every connection listing.

## Public API

- `WebsocketsRunner` (`src/runner/WebsocketsRunner.ts:31`) — dispatches an `IWebsocketsEvent` to registered `WebsocketsRouteHandler`s and sends the response back over the transport; instantiated by `api-websockets-aws`'s `WebSocketLambdaHandler` and `api-websockets-standalone`'s equivalent (the only two concrete transports).
- `ConnectionRegistry` / `WebsocketsTransport` / `WebsocketsEventValidator` (abstractions under `src/features/ConnectionRegistry`, `src/transport`, `src/validator`) — the pluggable contracts every concrete transport package (currently `api-websockets-aws`) implements.
- `WebsocketsSendToConnectionsUseCase` / `WebsocketsSendToIdentityUseCase` / `WebsocketsDisconnectUseCase` / `WebsocketsListConnectionsUseCase` (`src/features/*/abstractions.ts`) — the use cases other packages inject to push data to connected clients. `SendToConnectionsUseCase` has one external consumer (`api-file-manager-s3`'s threat-scan result notifier); `SendToIdentityUseCase` has roughly a dozen consumers across bulk-action extensions and `ai-powerups` (task-completion notifications).
- `WebsocketsGraphQLFactory` (`src/graphql/WebsocketsGraphQLFactory.ts`) — registers the `WebsocketsQuery.listConnections` and `WebsocketsMutation.disconnect*` GraphQL operations used by the Admin app's connection-management UI.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/api-websockets/src/handler/headers.ts` | Security finding SEC-27 — see private notes. | — | high |
| 2 | high | `packages/api-websockets/src/graphql/WebsocketsGraphQLFactory.ts` | Security finding SEC-28 — see private notes. | — | high |
| 3 | medium | `packages/api-websockets/src/features/ListConnections/ListConnectionsUseCase.ts:30-31` | `execute()` unconditionally filters out any connection whose `connectedOn` is more than 3 hours in the past, regardless of whether the connection is actually still open. This filter runs on every read path: the `listConnections` GraphQL query, `SendToIdentityUseCase`/`DisconnectUseCase` (both call `listConnections.execute` internally), and `disconnectTenant`/`disconnectAll`. | A websocket connection that stays open for more than 3 hours (a normal occurrence — clients typically keep a socket alive via ping/pong rather than reconnecting) silently stops appearing in `listConnections`, stops receiving `SendToIdentityUseCase`-driven notifications (e.g. a long-running bulk action's completion push), and is skipped by `disconnectTenant`/`disconnectAll`, even though the socket is still live and registered. | high |

## Duplication

- Intra-package (jscpd): `src/runner/routes/connect.ts:15-28` and `src/runner/routes/default.ts:8-21` share the same "if `!tenant` → error; else if `!identity` → error" boilerplate (14 duplicated lines). `src/graphql/WebsocketsGraphQLFactory.ts` has four near-identical resolver bodies (lines ~129-143, 157-172, 186-201, 215-230, 241-255) that each repeat the same `checkPermissions` → `try/catch` → `Result` → `Response`/`ErrorResponse` wrapping pattern for `listConnections`/`disconnect`/`disconnectIdentity`/`disconnectTenant`. None of this is functionally wrong, but a shared "authorize + run use case + wrap result" helper would remove ~60 duplicated lines.
- No reimplementation of lower-level dependency utilities was found; the package correctly builds its GraphQL layer on `@webiny/api-graphql`'s `Response`/`ErrorResponse` envelope rather than rolling its own, and reuses `@webiny/api-core`'s `IdentityContext`/`TenantContext` rather than inventing its own identity/tenant abstractions.

## Dead code

- `ConnectionRegistry.listStale(olderThan)` and `ConnectionRegistry.updateLastSeen(connectionId)` (`src/features/ConnectionRegistry/abstractions.ts:35-36`) are part of the public abstraction contract but have zero callers anywhere inside `api-websockets` itself — codegraph: no consumers within this package. The only implementation in the monorepo (`api-websockets-aws`'s `WebsocketsConnectionRegistry`) is a permanent no-op (`listStale` always returns `[]`), so GoneException-driven or heartbeat-driven stale-connection cleanup is effectively unimplemented anywhere; the 3-hour cutoff in `ListConnectionsUseCase` (see Bugs #3) is the only thing standing in for it.

## Convention issues

None found. Abstraction/implementation files follow the repo's one-per-file DI convention (e.g. `SendToIdentity/abstractions.ts` + `SendToIdentity/SendToIdentityUseCase.ts`), `exports/api.ts` re-exports only the types/abstractions other packages actually need, and namespace types (`WebsocketsRunner.Event`, `ConnectionRegistry.Interface`, etc.) are used consistently instead of ad hoc inline types.

## Test gaps

- See private security notes for a test gap related to Bugs #1 and #2.
- No test covers the 3-hour `connectedOn` cutoff in `ListConnectionsUseCase` (Bugs #3) — nothing exercises a connection older than the cutoff to confirm it should still be reachable.
- `SendToIdentityUseCase`/`SendToConnectionsUseCase` have no dedicated unit test in this package (only exercised indirectly via `websocketsContext.test.ts`); the actual `WebsocketsTransport.send` failure path (e.g. a rejected send) is untested here.

## Recommendations

1. Address the two security findings first — see private notes for details and fix direction.
2. Replace the hardcoded 3-hour `connectedOn` filter in `ListConnectionsUseCase` with real stale-connection detection (wire up `ConnectionRegistry.listStale`/`updateLastSeen`, driven by GoneException handling and/or a periodic heartbeat in the concrete transport), so long-lived legitimate connections aren't silently dropped from listings and broadcasts.
3. Extract the repeated "checkPermissions → run use case → wrap Result as Response/ErrorResponse" pattern in `WebsocketsGraphQLFactory.ts` into a small shared resolver helper to remove the duplicated blocks and make it harder to add a new mutation that forgets the permission check.
