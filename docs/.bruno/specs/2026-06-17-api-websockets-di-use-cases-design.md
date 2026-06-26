# Design: api-websockets DI Use Cases

## Summary

Refactor `@webiny/api-websockets` to replace the monolithic `WebsocketsContext` class with 4 independent, DI-registered use cases. Remove `context.websockets` entirely — consumers resolve use cases from the container.

## Motivation

The current `WebsocketsContext` class bundles 4 distinct responsibilities (send to identity, send to connections, list connections, disconnect) into a single class registered on `context.websockets`. This couples consumers to the full interface and prevents independent testing or replacement of individual operations.

## Decisions

- **Clean break:** No backward-compat facades. `context.websockets`, `IWebsocketsContextObject`, `WebsocketService` abstraction, and `Websockets` alias are all removed.
- **DI-only access:** Consumers resolve individual use cases from `context.container`.
- **Use case dependencies:** `DisconnectUseCase` and `SendToIdentityUseCase` inject `ListConnectionsUseCase` via DI (not duplicated registry logic).
- **Stale filter stays inline:** The 3-hour stale connection filter remains in `ListConnectionsUseCase`.
- **ConnectionRegistry resolved from container:** The runner and AWS handler resolve `ConnectionRegistry` from DI instead of accessing `context.websockets.registry`.
- **WebsocketsTransport unchanged:** The existing `WebsocketsTransport` DI token stays as-is. It is already resolved from the container in `handler.ts`.
- **IWebsocketsIdentity rehomed to `types.ts`:** The `IWebsocketsIdentity` type alias moves from the deleted `context/abstractions/IWebsocketsContext.ts` to `types.ts`, where other shared types already live. Three surviving files import it from old paths and must be updated: `registry/abstractions/IWebsocketsConnectionRegistry.ts` (imports from `~/context/abstractions/IWebsocketsContext.js`), `plugins/WebsocketsRoutePlugin.ts` (imports from `~/context/index.js`), `runner/WebsocketsRunner.ts` (imports from `~/context/index.js`). The deleted `context/WebsocketsContext.ts` also imports it but is self-resolving since that file is removed.
- **Method rename:** The current `send()` method on `IWebsocketsContextObject` becomes `SendToIdentityUseCase.execute()`. The old name is not preserved.

## Feature Structure

```
packages/api-websockets/src/features/
  ListConnections/
    abstractions.ts              # IListConnectionsUseCase + DI token + namespace
    ListConnectionsUseCase.ts    # implementation
  SendToIdentity/
    abstractions.ts              # ISendToIdentityUseCase + DI token + namespace
    SendToIdentityUseCase.ts     # depends on ListConnections + Transport
  SendToConnections/
    abstractions.ts              # ISendToConnectionsUseCase + DI token + namespace
    SendToConnectionsUseCase.ts  # depends on Transport
  Disconnect/
    abstractions.ts              # IDisconnectUseCase + DI token + namespace
    DisconnectUseCase.ts         # depends on ListConnections + Registry + Transport
  ConnectionRegistry/            # already exists, unchanged
    abstractions.ts
  shared/
    errors.ts                    # moved from WebsocketService/errors.ts
  feature.ts                     # createFeature — registers all 4 use cases
```

## DI Tokens

| Use Case | Token Scope |
|---|---|
| ListConnectionsUseCase | `"Websockets/ListConnections"` |
| SendToIdentityUseCase | `"Websockets/SendToIdentity"` |
| SendToConnectionsUseCase | `"Websockets/SendToConnections"` |
| DisconnectUseCase | `"Websockets/Disconnect"` |

All registered as singletons.

## Interfaces

### ListConnectionsUseCase

The param types from `IWebsocketsContextListConnectionsParams` and `IWebsocketsContextListConnectionsParamsWhere` are renamed to drop the "Context" infix: `IWebsocketsListConnectionsParams` and `IWebsocketsListConnectionsParamsWhere`. They live in `ListConnections/abstractions.ts`.

```typescript
interface IWebsocketsListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    connections?: string[];
}

interface IWebsocketsListConnectionsParams {
    where?: IWebsocketsListConnectionsParamsWhere;
}

interface IListConnectionsUseCase {
    execute(
        params?: IWebsocketsListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}
```

### SendToIdentityUseCase

```typescript
interface ISendToIdentityUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}
```

### SendToConnectionsUseCase

```typescript
interface ISendToConnectionsUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}
```

### DisconnectUseCase

`IWebsocketsDisconnectParams` is a type alias for `IWebsocketsListConnectionsParams` (same as before — disconnect takes the same filter shape). It lives in `Disconnect/abstractions.ts` and imports the source type from `ListConnections/abstractions.ts`. This is a one-directional import (Disconnect depends on ListConnections), not circular.

```typescript
interface IDisconnectUseCase {
    execute(
        params?: IWebsocketsDisconnectParams,
        notify?: boolean
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}
```

Implementation note: the current `disconnect()` silently swallows `registry.unregister()` failures per connection (empty `catch` block). This is intentional — a failed unregister for one connection should not prevent disconnecting others. The `DisconnectUseCase` implementation must preserve this behavior.

## Dependency Graph

```
SendToIdentityUseCase ──> ListConnectionsUseCase ──> ConnectionRegistry
                     └──> WebsocketsTransport

SendToConnectionsUseCase ──> WebsocketsTransport

DisconnectUseCase ──> ListConnectionsUseCase ──> ConnectionRegistry
                 └──> ConnectionRegistry (unregister)
                 └──> WebsocketsTransport (notify + disconnect)
```

## Feature Registration

A single `createFeature` in `features/feature.ts`:

```typescript
export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container) {
        container.register(WebsocketsListConnectionsUseCase, /* ... */);
        container.register(WebsocketsSendToIdentityUseCase, /* ... */);
        container.register(WebsocketsSendToConnectionsUseCase, /* ... */);
        container.register(WebsocketsDisconnectUseCase, /* ... */);
    }
});
```

This replaces the `createWebsocketsContext` ContextPlugin.

## Consumer Migration

### GraphQL Resolvers (createResolvers.ts)

5 call sites total — 1 `listConnections` + 4 `disconnect` variants (by connections, by identity, by tenant, all):

```typescript
/* Before */
const result = await context.websockets.listConnections(args);
const result = await context.websockets.disconnect({ where: { connections: args.connections } });

/* After */
const listConnections = context.container.resolve(WebsocketsListConnectionsUseCase);
const result = await listConnections.execute(args);

const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
const result = await disconnect.execute({ where: { connections: args.connections } });
```

The type import `IWebsocketsContextListConnectionsParams` from `~/context/index.js` is replaced with `IWebsocketsListConnectionsParams` from `~/features/ListConnections/abstractions.js`. The resolver arg type annotation `args: IWebsocketsContextListConnectionsParams` becomes `args: IWebsocketsListConnectionsParams`.

### WebsocketsRunner (runner/WebsocketsRunner.ts)

The runner has two migration points:

1. **`respond()` method** calls `this.context.websockets.sendToConnections()` — this is the hot path for every message reply. After migration, the runner resolves `WebsocketsSendToConnectionsUseCase` from the container.

2. **`executeRoute()` method** passes `registry: this.registry` into route plugin callable params via `IWebsocketsRoutePluginCallableParams`. The runner stops receiving `registry` as a constructor param — instead resolves `ConnectionRegistry` from the container and passes the resolved instance to route plugins. The `IWebsocketsRoutePluginCallableParams.registry` field stays (route plugins still receive the registry directly); only the source of truth changes from constructor injection to container resolution.

```typescript
/* Before — constructor */
constructor(context, registry, response) { ... }

/* After — resolve from container */
constructor(context, response) {
    this.registry = context.container.resolve(ConnectionRegistry);
    this.sendToConnections = context.container.resolve(WebsocketsSendToConnectionsUseCase);
}

/* Before — respond() */
await this.context.websockets.sendToConnections([connection], dataToSend);

/* After — respond() */
await this.sendToConnections.execute([connection], dataToSend);
```

The `MiddlewareParams` type keeps its `registry` field — it just comes from `this.registry` (resolved from container) instead of a constructor param.

The `IWebsocketsRunner` interface only declares `run(event)` — no constructor signature — so it needs no change. Callers that construct `WebsocketsRunner` directly (e.g., `api-websockets-aws/handler.ts`) must drop the `registry` argument from the constructor call.

### AWS Handler (api-websockets-aws/handler.ts)

```typescript
/* Before */
context.websockets.registry

/* After */
context.container.resolve(ConnectionRegistry)
```

### Types (types.ts)

Remove `websockets: IWebsocketsContextObject` from the `Context` interface.

### Exports (exports/api.ts)

Replace `Websockets` alias with 4 use case abstractions:

```typescript
export { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
export { WebsocketsSendToIdentityUseCase } from "~/features/SendToIdentity/abstractions.js";
export { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
export { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
```

## Errors

Existing error classes move from `features/WebsocketService/errors.ts` to `features/shared/errors.ts`:

- `WebsocketServiceError` — general transport/registry errors
- `WebsocketForceDisconnectNotificationError` — failed to notify clients
- `WebsocketForceDisconnectError` — failed to force-disconnect

The error type union currently exposed as `WebsocketService.Error` becomes a standalone type alias named `WebsocketsError`:

```typescript
export type WebsocketsError =
    | WebsocketServiceError
    | WebsocketForceDisconnectNotificationError
    | WebsocketForceDisconnectError;
```

This union type is re-exported from `exports/api.ts` alongside the 4 use case abstractions.

## Updated Files

### `index.ts` (package entry point)

`createWebsockets()` currently returns `[createWebsocketsContext(), createWebsocketsGraphQL()]`. After migration, `createWebsocketsContext()` no longer exists — feature registration happens via `WebsocketsFeature`. `createWebsockets()` is updated to return `[createWebsocketsGraphQL()]` and the `WebsocketsFeature` is exported separately for container registration.

The `export * from "./context/index.js"` line is removed. Types previously re-exported through that barrel:
- `IWebsocketsContextObject` — deleted (no replacement)
- `IWebsocketsContextListConnectionsParams` — renamed, now exported from `features/ListConnections/abstractions.ts`
- `IWebsocketsContextListConnectionsParamsWhere` — renamed, now exported from `features/ListConnections/abstractions.ts`
- `IWebsocketsContextDisconnectConnectionsParams` — renamed to `IWebsocketsDisconnectParams`, now exported from `features/Disconnect/abstractions.ts`
- `IWebsocketsIdentity` — moved to `types.ts`
- `createWebsocketsContext` — deleted (replaced by `WebsocketsFeature`)

## Deleted Files

- `context/WebsocketsContext.ts` — monolithic class
- `context/abstractions/IWebsocketsContext.ts` — monolithic interface
- `context/index.ts` — ContextPlugin
- `context/` — entire directory (empty after above deletions)
- `features/WebsocketService/abstractions.ts` — old DI token
- `features/WebsocketService/index.ts` — re-export
- `features/WebsocketService/` — entire directory (errors.ts moved to `features/shared/`)

## Testing

Existing tests update to resolve use cases from the container instead of accessing `context.websockets`. Each use case can be tested independently by mocking its direct DI dependencies. The `WebsocketsFeature` replaces `createWebsocketsContext()` in test setup.

Test files that need migration:

- `packages/api-websockets/__tests__/runner/websocketsRunner.test.ts` — directly instantiates `WebsocketsContext`, passes `registry` to `WebsocketsRunner` constructor. Must switch to DI-based setup: register `WebsocketsFeature`, resolve use cases from container.
- `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts` — accesses `context.websockets.registry`. Must resolve `ConnectionRegistry` from `context.container`.
- `packages/api-websockets-aws/__tests__/handler/handler.test.ts` — multiple call sites (6+) use `context.websockets.listConnections()`. All must resolve `WebsocketsListConnectionsUseCase` from the container.

## External Consumer Migration

The following packages resolve `WebsocketService` from the DI container and call methods on it. Each must be updated to resolve the individual use case abstractions instead.

### `packages/api-record-locking` — KickOutCurrentUserUseCase

Calls `websocketService.send()`. Migrate to resolve `WebsocketsSendToIdentityUseCase` and call `.execute()`.

### `packages/ai-powerups` — AiImageEnrichmentTask

Calls `websocketService.listConnections()` and `websocketService.sendToConnections()`. The current `WebsocketService` dependency is registered as optional (`{ optional: true }`). Migrate to resolve `WebsocketsListConnectionsUseCase` and `WebsocketsSendToConnectionsUseCase` — both must preserve the optional flag so the task works in environments without websockets configured.

### `packages/ai-powerups` — WbGeneratePageContentTask

Calls `websocketService.send()` (the identity-based send). The dependency is non-optional (no `{ optional: true }` flag, task always calls it). Migrate to resolve `WebsocketsSendToIdentityUseCase` and call `.execute()`. Preserve non-optional injection.

### `packages/api-file-manager-s3` — processThreatScanResult

Resolves `WebsocketService` from container (non-optional — no `{ optional: true }` flag; will throw if websockets not registered, matching current behavior). Calls `listConnections()` and `sendToConnections()`. Also uses the `WebsocketService.Connection` type alias (which maps to `IWebsocketsConnectionRegistryData`). Migrate to resolve `WebsocketsListConnectionsUseCase` and `WebsocketsSendToConnectionsUseCase` (non-optional), and replace `WebsocketService.Connection` with a direct import of `IWebsocketsConnectionRegistryData` from `@webiny/api-websockets/registry`.

### `packages/webiny/src/api.ts`

Re-exports `WebsocketService as Websockets`. Must be updated to re-export the 4 individual use case abstractions from their new paths.

## Scope

This design covers `packages/api-websockets` and all packages that consume the `WebsocketService` DI token or `context.websockets`:

- `packages/api-websockets` (primary)
- `packages/api-websockets-aws`
- `packages/api-record-locking`
- `packages/ai-powerups`
- `packages/api-file-manager-s3`
- `packages/webiny` (re-export)

It does not cover `packages/api-websockets-server` (the new Docker/self-hosted package from the current branch).
