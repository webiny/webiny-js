# api-websockets-server — Design Spec

Package: `@webiny/api-websockets-server`
Date: 2026-06-16
Status: Approved

## Purpose

A Docker/self-hosted WebSocket server transport for the platform-agnostic `@webiny/api-websockets` base package. Mirrors the pattern established by `@webiny/api-websockets-aws` but replaces Lambda + API Gateway with a persistent Node.js WebSocket server.

## Scope

- Single-server deployments only. Multi-server (horizontal scaling) is explicitly out of scope.
- Built-in Node `ws` as the default WebSocket library, with abstractions so users can plug in alternatives (uWebSockets, etc.).
- Two modes: standalone (owns HTTP + WS server) and attach (user provides HTTP server).
- No source handler registry — the server directly feeds events to `WebsocketsRunner`.
- Auth stays in existing route plugins, not at the HTTP upgrade level.
- `endpoint` is set to the server's own address (e.g. `ws://localhost:8080`).

## Dependencies

### Internal (`@webiny/*`)

- `@webiny/api-websockets` — base types, `WebsocketsTransport`, `WebsocketsRunner`, route plugins, `IWebsocketsEventValidator`
- `@webiny/handler` — `createRegisterExtensionPlugin`
- `@webiny/feature` — `createAbstraction`
- `@webiny/error` — `WebinyError`
- `@webiny/plugins` — `PluginsContainer`
- `@webiny/utils` — `mdbid` (for connectionId generation)

### External (npm)

- `ws` — built-in Node WebSocket library (default adapter implementation)

## Package Structure

```
packages/api-websockets-server/src/
├── index.ts                               # createServerWebsockets()
├── abstractions.ts                        # All 3 DI abstractions + namespaces
├── server/
│   ├── WebsocketsServer.ts                # Lifecycle orchestrator
│   └── types.ts                           # Config types
├── adapter/
│   ├── NodeWsAdapter.ts                   # Default adapter (built-in ws)
│   └── types.ts                           # Raw WS types from adapter
├── transport/
│   └── ServerWebsocketsTransport.ts       # WebsocketsTransport.Interface impl
├── validator/
│   └── ServerWebsocketsEventValidator.ts  # Raw WS events → IWebsocketsEvent
├── connectionManager/
│   └── ServerConnectionManager.ts         # Socket map + registry sync + heartbeat
├── upgradeHandler/
│   └── DefaultUpgradeHandler.ts           # Default accept-all + filtering hook
└── exports/
    └── api.ts                             # Public API surface
```

## Abstractions

Three DI abstractions live in `abstractions.ts` using the `createAbstraction` + namespace pattern. All follow the `Websockets*` naming convention established by the codebase (`WebsocketsTransport`, `WebsocketsRunner`, etc.).

### WebsocketsServerAdapter

Wraps the WebSocket library. The default implementation (`NodeWsAdapter`) uses Node built-in `ws`. Users can swap in any WS library by providing an alternative implementation.

The interface is generic over `TSocket` — each adapter implementation binds it to its own socket type (e.g. `WebSocket` from `ws`). The `WebsocketsConnectionManager` and `ServerWebsocketsTransport` are also generic over the same `TSocket`, so the type flows through the entire stack. At the DI level, the concrete implementation classes close over `TSocket` at class definition time (e.g. `class NodeWsAdapterImpl implements WebsocketsServerAdapter.Interface<WebSocket>`), so `createImplementation` calls do not need explicit type arguments — the generic is resolved by the class.

```typescript
interface IWebsocketsServerAdapter<TSocket> {
    start(server: HttpServer): void;
    stop(): Promise<void>;
    onConnection(cb: (socket: TSocket, request: IncomingMessage) => void): void;
    onMessage(socket: TSocket, cb: (data: Buffer) => void): void;
    onClose(socket: TSocket, cb: (code: number, reason: Buffer) => void): void;
    onError(socket: TSocket, cb: (error: Error) => void): void;
    send(socket: TSocket, data: string): Promise<void>;
    close(socket: TSocket, code?: number, reason?: string): void;
}
```

### WebsocketsUpgradeHandler

Pre-connection filtering during HTTP upgrade. Not for auth (that stays in route plugins) — for CORS, rate limiting, IP allowlists.

```typescript
interface IWebsocketsUpgradeHandler {
    shouldUpgrade(request: IncomingMessage): Promise<UpgradeDecision>;
}

type UpgradeDecision =
    | { allowed: true }
    | { allowed: false; statusCode: number; reason: string };
```

Default implementation accepts all connections.

### WebsocketsConnectionManager

Owns the local `Map<connectionId, TSocket>`, coordinates with the SQL connection registry (`IWebsocketsConnectionRegistry`), and manages heartbeat/TTL updates. Also stores per-connection metadata (`connectedAt`, `host`, `headers`) needed for building `IWebsocketsEvent` on message/disconnect events.

```typescript
interface IWebsocketsConnectionManager<TSocket> {
    add(params: WebsocketsConnectionManager.AddParams<TSocket>): Promise<void>;
    remove(connectionId: string): Promise<void>;
    getSocket(connectionId: string): TSocket | undefined;
    getMetadata(connectionId: string): WebsocketsConnectionManager.ConnectionMetadata | undefined;
    updateLastSeen(connectionId: string): Promise<void>;
    cleanup(maxAge: number): Promise<string[]>;
}
```

```typescript
namespace WebsocketsConnectionManager {
    interface AddParams<TSocket> {
        connectionId: string;
        socket: TSocket;
        endpoint: string;
        identity: IWebsocketsIdentity;
        tenant: string;
        connectedAt: number;
        host: string;
        headers: Record<string, string>;
    }

    interface ConnectionMetadata {
        connectionId: string;
        endpoint: string;
        connectedAt: number;
        host: string;
        headers: Record<string, string>;
    }
}
```

- `add` inserts into the local map (socket + metadata) only. It does NOT call `registry.register()` — registry writes happen in the existing connect route plugin. This avoids double-registration.
- `remove` deletes from the local map and calls `registry.unregister()`. Idempotent — swallows `CONNECTION_NOT_FOUND` errors (the disconnect route plugin may have already unregistered).
- `getSocket` returns the live socket reference from the local map.
- `getMetadata` returns stored per-connection metadata (needed by the validator for message/disconnect events).
- `updateLastSeen` calls `registry.updateLastSeen(connectionId)` to refresh the `lastSeen` timestamp in the SQL storage.
- `cleanup` queries the registry for stale entries via `registry.listStale(olderThan)` and removes them from both registry and local map. Returns removed connectionIds.

Note: `connectedAt` (number, Unix ms) must be converted to `connectedOn` (ISO 8601 string) when the connect route plugin calls `registry.register()`. This conversion is the same one the existing connect route already performs.

## Transport

`ServerWebsocketsTransport` implements `WebsocketsTransport.Interface`.

- Delegates socket lookup to `WebsocketsConnectionManager.getSocket()`.
- Delegates wire operations to `WebsocketsServerAdapter.send()` and `.close()`.
- When a socket isn't found locally, triggers lazy cleanup — removes the stale connection from the registry via `connectionManager.remove()` (which is idempotent).
- Created via `WebsocketsTransport.createImplementation({ implementation: ServerWebsocketsTransportImpl, dependencies: [WebsocketsConnectionManager, WebsocketsServerAdapter] })`, following the same pattern as `AwsWebsocketsTransport`.

## Event Validator

`ServerWebsocketsEventValidator` implements `IWebsocketsEventValidator` (imported from `@webiny/api-websockets`). It is a plain class, constructed directly — not a DI abstraction. This matches the AWS pattern where `AwsWebsocketsEventValidator` is instantiated with `new` inside the handler.

The validator receives a pre-built internal event object from the `WebsocketsServer` orchestrator (not a raw unknown input like the AWS validator). The orchestrator assembles event data from the adapter callback args and the connection manager's stored metadata.

Three scenarios:

**Connect** — WebSocket connection opens:
- `eventType: "connect"`, `route: "connect"`
- `connectionId` generated via `mdbid()`
- `connectedAt` set to `Date.now()`
- `host` from `request.headers.host`
- `endpoint` is the server's own address
- `headers` from the upgrade request
- `body: undefined`

**Message** — incoming message:
- `eventType: "message"`, `route: "default"` (or custom from `body.action`)
- `connectionId`, `connectedAt`, `host`, `endpoint` retrieved from `connectionManager.getMetadata()`
- `headers` also from stored metadata
- `body` is `JSON.parse(rawMessage)` — malformed JSON rejected with error response

**Disconnect** — connection closes:
- `eventType: "disconnect"`, `route: "disconnect"`
- `connectionId`, `connectedAt`, `host`, `endpoint` retrieved from `connectionManager.getMetadata()`
- `body: undefined`

## Context Lifecycle

In the AWS package, a fresh Fastify app + Webiny `Context` is created per Lambda invocation. A persistent server cannot do that.

The `WebsocketsServer` creates the Webiny application context **once at startup**:

1. Server start calls `createBaseHandler(params)` from `@webiny/handler` to get a Fastify app with a fully initialized Webiny `Context`.
2. The context plugins (`createWebsocketsContext`, `createServerWebsockets`, storage, security, tenancy) run once during Fastify's preHandler lifecycle, triggered by a single bootstrap request.
3. The resulting `context` object (with `context.websockets`, `context.tenancy`, `context.security`, `context.container`) is captured and reused for all WebSocket events.
4. The `WebsocketsRunner` is constructed once with this shared context and reused for all events.

This means the server operates with a single shared context instance. Tenant/identity resolution happens per-event inside the route plugins (the connect route reads `event.body.token` and `event.body.tenant`), not at context construction time — so sharing the context is safe.

## Server Lifecycle

`WebsocketsServer` is the top-level orchestrator. Not a DI abstraction — created by factory functions.

### Standalone mode — `createWebsocketsServer(params)`

```typescript
const server = createWebsocketsServer({
    port: 8080,
    host: "0.0.0.0",
    plugins: [...],
    heartbeatInterval: 60000,
});

await server.start();
await server.stop();
```

Creates its own HTTP server, attaches WS, bootstraps context, starts heartbeat.

### Attach mode — `attachWebsocketsServer(params)`

```typescript
const httpServer = http.createServer(/* your app */);

const server = attachWebsocketsServer({
    server: httpServer,
    plugins: [...],
    heartbeatInterval: 60000,
});

await server.start();
// httpServer.listen() is the user's responsibility
```

Attaches WS to an existing HTTP server. `start()` is async in both modes (bootstraps context, resolves DI). The difference is that standalone also creates and listens on its own HTTP server.

### Event flow (both modes)

1. HTTP upgrade request arrives.
2. `WebsocketsUpgradeHandler.shouldUpgrade(request)` — reject or accept.
3. If accepted, adapter completes the upgrade.
4. On open: connection manager adds socket + metadata to local map → validator creates connect event → runner executes connect route (which calls `registry.register()` — the only registry write for new connections).
5. On message: validator creates message event (metadata from connection manager) → runner executes route → response sent via transport. Connection manager calls `registry.updateLastSeen()`.
6. On close: validator creates disconnect event (metadata from connection manager) → runner executes disconnect route (which calls `registry.unregister()`) → connection manager removes socket from local map.
7. Heartbeat timer runs `connectionManager.cleanup(maxAge)` periodically.

### DI plugin — `createServerWebsockets()`

All implementations are created via `createImplementation` on their respective abstraction tokens, following the `AwsWebsocketsTransport` pattern:

```typescript
export const createServerWebsockets = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        context.container.register(ServerWebsocketsTransport).inSingletonScope();
        context.container.register(NodeWsAdapter).inSingletonScope();
        context.container.register(DefaultUpgradeHandler).inSingletonScope();
        context.container.register(ServerConnectionManager).inSingletonScope();
    });
    plugin.name = "websockets.server.transport";
    return [plugin];
};
```

Where each constant is the result of `AbstractionToken.createImplementation(...)`, not the raw class:

```typescript
export const ServerWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: ServerWebsocketsTransportImpl,
    dependencies: [WebsocketsConnectionManager, WebsocketsServerAdapter]
});

export const NodeWsAdapter = WebsocketsServerAdapter.createImplementation({
    implementation: NodeWsAdapterImpl,
    dependencies: []
});

export const DefaultUpgradeHandler = WebsocketsUpgradeHandler.createImplementation({
    implementation: DefaultUpgradeHandlerImpl,
    dependencies: []
});

export const ServerConnectionManager = WebsocketsConnectionManager.createImplementation({
    implementation: ServerConnectionManagerImpl,
    dependencies: [ConnectionRegistry]
});
```

The server factory functions call `createServerWebsockets()` internally. Also exported separately for users who want custom container wiring.

## Cleanup Strategy

Two mechanisms (belt and suspenders):

### Lazy cleanup (in transport)

When `send` or `disconnect` can't find a socket in the local map, the transport removes that connection from the registry via `connectionManager.remove()`. This method is idempotent — it swallows `CONNECTION_NOT_FOUND` errors from the underlying `registry.unregister()` call. This prevents conflicts with the disconnect route plugin, which also calls `registry.unregister()`.

### TTL cleanup (in connection manager)

Periodic sweep via heartbeat timer:

- `add()` stores a `lastSeen` timestamp alongside the registry entry.
- On every message, `updateLastSeen(connectionId)` refreshes the timestamp.
- `cleanup(maxAge)` queries the registry via a new `listStale(olderThan: Date)` method for entries where `lastSeen` is older than `maxAge`, removes them from both registry and local map.
- `heartbeatInterval` is configurable (default 60s). `maxAge` defaults to `5 * heartbeatInterval`.

### Registry interface changes

The `IWebsocketsConnectionRegistry` interface (in `@webiny/api-websockets`) needs two new methods:

```typescript
updateLastSeen(connectionId: string): Promise<void>;
listStale(olderThan: Date): Promise<IWebsocketsConnectionRegistryData[]>;
```

- `updateLastSeen` sets the `lastSeen` column to the current datetime for the given connection.
- `listStale` returns all connections where `lastSeen` is older than `olderThan`.

Both must be implemented in `api-websockets-sql` (SQL queries on the `lastSeen` column) and `api-websockets-ddb`. The DDB implementations can be no-ops (`updateLastSeen` does nothing, `listStale` returns empty array) since the heartbeat feature is only used with the server package, which targets SQL storage.

### `lastSeen` column

New nullable `datetime` column on the existing `WebsocketsConnections` SQL table in `api-websockets-sql`. Added via the lazy migration pattern already used in that package. Existing rows (from AWS deployments) won't have it — that's fine since TTL cleanup is server-only.

### Graceful shutdown

`server.stop()`:
1. Set a `shuttingDown` flag — suppresses the normal event flow for `onClose` callbacks. Without this, closing sockets in step 3 would trigger the disconnect route plugin for every active connection, running business logic (notifications, etc.) that should only fire on genuine client disconnects.
2. Stop accepting new connections.
3. Stop heartbeat timer.
4. Close all active WebSocket connections (with close frame). The `onClose` callbacks fire but are no-ops due to the `shuttingDown` flag.
5. Remove all local connections from registry directly via `connectionManager.remove()` (batch cleanup, no route plugins).
6. Close HTTP server (standalone mode only).

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| WS library | Built-in Node `ws` with adapter abstraction | Pluggable without lock-in |
| Server modes | Standalone + attach | Simple default, flexible for advanced users |
| Source handler registry | Skip | Server owns lifecycle, no event sniffing needed |
| Auth | Route plugins only | Same flow as AWS, no upgrade-level auth |
| Endpoint field | Server's own address | Useful for storage consistency and future multi-server |
| Multi-server | Out of scope | Single-instance covers Docker/self-hosted use case |
| Connection tracking | Local map + SQL registry | Map for socket refs, registry for queryable metadata |
| Cleanup | Lazy (on send fail) + TTL (heartbeat) | Belt and suspenders — catches all stale entries |
| Abstraction approach | Full stack (B) | Three abstractions: adapter, upgrade handler, connection manager |
| Validator | Plain class, direct instantiation | Matches AWS pattern — not a DI abstraction |
| Context lifecycle | Single shared instance at startup | Tenant/identity resolved per-event in route plugins |
| Naming | `Websockets*` prefix | Matches codebase convention |
| Socket type | Generic `TSocket` on adapter/manager/transport | Flows through stack, no casts needed |
