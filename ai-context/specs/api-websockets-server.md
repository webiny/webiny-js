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

## Package Structure

```
packages/api-websockets-server/src/
├── index.ts                               # createServerWebsockets()
├── abstractions.ts                        # All 3 abstractions + namespaces
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

All three live in `abstractions.ts` using the `createAbstraction` + namespace pattern.

### WebSocketServerAdapter

Wraps the WebSocket library. The default implementation uses Node built-in `ws`. Users can swap in any WS library by providing an alternative implementation.

```typescript
interface IWebSocketServerAdapter {
    start(server: HttpServer): void;
    stop(): Promise<void>;
    onConnection(cb: (socket: RawSocket, request: IncomingMessage) => void): void;
    onMessage(socket: RawSocket, cb: (data: Buffer) => void): void;
    onClose(socket: RawSocket, cb: (code: number, reason: Buffer) => void): void;
    onError(socket: RawSocket, cb: (error: Error) => void): void;
    send(socket: RawSocket, data: string): Promise<void>;
    close(socket: RawSocket, code?: number, reason?: string): void;
}
```

`RawSocket` is a generic type — the adapter owns all direct library interaction.

### WebSocketUpgradeHandler

Pre-connection filtering during HTTP upgrade. Not for auth (that stays in route plugins) — for CORS, rate limiting, IP allowlists.

```typescript
interface IWebSocketUpgradeHandler {
    shouldUpgrade(request: IncomingMessage): Promise<UpgradeDecision>;
}

type UpgradeDecision =
    | { allowed: true }
    | { allowed: false; statusCode: number; reason: string };
```

Default implementation accepts all connections.

### WebSocketConnectionManager

Owns the local `Map<connectionId, RawSocket>`, coordinates with the SQL connection registry, and manages heartbeat/TTL updates.

```typescript
interface IWebSocketConnectionManager {
    add(connectionId: string, socket: RawSocket, endpoint: string): Promise<void>;
    remove(connectionId: string): Promise<void>;
    getSocket(connectionId: string): RawSocket | undefined;
    updateLastSeen(connectionId: string): Promise<void>;
    cleanup(maxAge: number): Promise<string[]>;
}
```

- `add` inserts into both the local map and the SQL registry.
- `remove` deletes from both.
- `updateLastSeen` updates the `lastSeen` timestamp in the registry.
- `cleanup` queries the registry for stale entries and removes them. Returns removed connectionIds.

## Transport

`ServerWebsocketsTransport` implements `WebsocketsTransport.Interface`.

- Delegates socket lookup to `WebSocketConnectionManager.getSocket()`.
- Delegates wire operations to `WebSocketServerAdapter.send()` and `.close()`.
- When a socket isn't found locally, triggers lazy cleanup — removes the stale connection from the registry via `connectionManager.remove()`.
- Registered via `WebsocketsTransport.createImplementation(...)`.
- Dependencies: `WebSocketConnectionManager`, `WebSocketServerAdapter`.

## Event Validator

`ServerWebsocketsEventValidator` implements `IWebsocketsEventValidator`. Maps raw WS events to `IWebsocketsEvent`.

Three scenarios:

**Connect** — WebSocket connection opens:
- `eventType: "connect"`, `route: "connect"`
- `connectionId` generated via uuid/mdbid
- `endpoint` is the server's own address
- `headers` from the upgrade request
- `body: undefined`

**Message** — incoming message:
- `eventType: "message"`, `route: "default"` (or custom from `body.action`)
- `body` is `JSON.parse(rawMessage)` — malformed JSON rejected with error response
- `headers` from the original upgrade request

**Disconnect** — connection closes:
- `eventType: "disconnect"`, `route: "disconnect"`
- `body: undefined`

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

Creates its own HTTP server, attaches WS, starts heartbeat.

### Attach mode — `attachWebsocketsServer(params)`

```typescript
const httpServer = http.createServer(/* your app */);

const server = attachWebsocketsServer({
    server: httpServer,
    plugins: [...],
    heartbeatInterval: 60000,
});

server.start();
// httpServer.listen() is the user's responsibility
```

Attaches WS to an existing HTTP server.

### Event flow (both modes)

1. HTTP upgrade request arrives.
2. `WebSocketUpgradeHandler.shouldUpgrade(request)` — reject or accept.
3. If accepted, adapter completes the upgrade.
4. On open: validator creates connect event → runner executes connect route → connection manager adds to map + registry.
5. On message: validator creates message event → runner executes route → response sent via transport. Connection manager updates `lastSeen`.
6. On close: validator creates disconnect event → runner executes disconnect route → connection manager removes from map + registry.
7. Heartbeat timer runs `connectionManager.cleanup(maxAge)` periodically.

### DI plugin — `createServerWebsockets()`

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

The server factory functions call this internally. Also exported separately for users who want custom container wiring.

## Cleanup Strategy

Two mechanisms (belt and suspenders):

### Lazy cleanup (in transport)

When `send` or `disconnect` can't find a socket in the local map, the transport removes that connection from the registry via `connectionManager.remove()`. Catches stale entries the moment someone tries to reach them.

### TTL cleanup (in connection manager)

Periodic sweep via heartbeat timer:

- `add()` stores a `lastSeen` timestamp alongside the registry entry.
- On every message, `updateLastSeen(connectionId)` refreshes the timestamp.
- `cleanup(maxAge)` queries the registry for entries where `lastSeen` is older than `maxAge`, removes them from both registry and local map.
- `heartbeatInterval` is configurable (default 60s). `maxAge` defaults to `5 * heartbeatInterval`.

### `lastSeen` column

New nullable `datetime` column on the existing `WebsocketsConnections` SQL table. Added via the lazy migration pattern already used in `api-websockets-sql`. Existing rows (from AWS deployments) won't have it — that's fine since TTL cleanup is server-only.

### Graceful shutdown

`server.stop()`:
1. Stop accepting new connections.
2. Stop heartbeat timer.
3. Close all active WebSocket connections (with close frame).
4. Remove all local connections from registry.
5. Close HTTP server (standalone mode only).

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
