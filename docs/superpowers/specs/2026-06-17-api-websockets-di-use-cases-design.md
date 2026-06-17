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
  errors.ts                      # moved from WebsocketService/errors.ts
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

`IWebsocketsDisconnectParams` is a type alias for `IWebsocketsListConnectionsParams` (same as before — disconnect takes the same filter shape). It lives in `Disconnect/abstractions.ts`.

```typescript
interface IDisconnectUseCase {
    execute(
        params?: IWebsocketsDisconnectParams,
        notify?: boolean
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}
```

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

```typescript
/* Before */
const result = await context.websockets.listConnections(args);

/* After */
const listConnections = context.container.resolve(WebsocketsListConnectionsUseCase);
const result = await listConnections.execute(args);
```

### WebsocketsRunner (runner/WebsocketsRunner.ts)

```typescript
/* Before */
await this.context.websockets.sendToConnections([connection], dataToSend);

/* After — resolve from container */
const sendToConnections = this.context.container.resolve(WebsocketsSendToConnectionsUseCase);
await sendToConnections.execute([connection], dataToSend);
```

The runner also stops receiving `registry` as a constructor param — resolves `ConnectionRegistry` from the container.

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

Existing error classes move from `features/WebsocketService/errors.ts` to `features/errors.ts`:

- `WebsocketServiceError` — general transport/registry errors
- `WebsocketForceDisconnectNotificationError` — failed to notify clients
- `WebsocketForceDisconnectError` — failed to force-disconnect

The error type union currently exposed as `WebsocketService.Error` becomes a standalone union type exported from `features/errors.ts`.

## Deleted Files

- `context/WebsocketsContext.ts` — monolithic class
- `context/abstractions/IWebsocketsContext.ts` — monolithic interface
- `context/index.ts` — ContextPlugin
- `features/WebsocketService/abstractions.ts` — old DI token
- `features/WebsocketService/index.ts` — re-export

## Testing

Existing tests update to resolve use cases from the container instead of accessing `context.websockets`. Each use case can be tested independently by mocking its direct DI dependencies. The `WebsocketsFeature` replaces `createWebsocketsContext()` in test setup.

## Scope

This design covers `packages/api-websockets` and the consumer updates in `packages/api-websockets-aws`. It does not cover `packages/api-websockets-server` (the new Docker/self-hosted package from the current branch).
