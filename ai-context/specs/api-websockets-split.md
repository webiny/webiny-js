# Spec: Split `api-websockets` into Base + AWS Provider

## Goal

Extract all AWS-specific code from `packages/api-websockets` into a new `packages/api-websockets-aws` package. The base package retains only abstractions and platform-agnostic logic. This enables a future `api-websockets-server` package for Docker/EC2/self-hosted deployments without touching the base.

## Current State

### Package landscape

```
packages/api-websockets        — abstractions + runner + context + graphql + handler (AWS-coupled)
packages/api-websockets-ddb    — DynamoDB connection registry implementation
packages/api-websockets-sql    — SQL connection registry implementation
packages/app-websockets        — frontend React provider + hooks
```

### AWS coupling in `api-websockets`

| File | AWS dependency |
|---|---|
| `src/transport/WebsocketsTransport.ts` | `ApiGatewayManagementApiClient`, `PostToConnectionCommand`, `DeleteConnectionCommand` |
| `src/validator/WebsocketsEventValidator.ts` | Validates API Gateway event shape (requestContext with connectionId, routeKey, eventType) |
| `src/handler/handler.ts` | `@webiny/handler-aws` (`createHandler`, `registerDefaultPlugins`, `execute`) |
| `src/handler/register.ts` | `@webiny/handler-aws/registry` (`createSourceHandler`) |
| `src/handler/types.ts` | `APIGatewayProxyResult`, `LambdaContext`, API Gateway event interfaces |
| `src/handler/headers.ts` | Extracts tenant/token from API Gateway event format |
| `src/context/index.ts` | Hard-codes `new WebsocketsTransport()` (the AWS impl) |
| `src/index.ts` | Side-effect import of `./handler/register.js` |

### What is already platform-agnostic

| Component | Files |
|---|---|
| Transport abstraction | `src/transport/abstractions/IWebsocketsTransport.ts` |
| Validator abstraction | `src/validator/abstractions/IWebsocketsEventValidator.ts` |
| Connection registry abstraction | `src/registry/abstractions/IWebsocketsConnectionRegistry.ts` |
| Feature abstractions | `src/features/ConnectionRegistry/abstractions.ts`, `src/features/WebsocketService/abstractions.ts` |
| Context object | `src/context/WebsocketsContext.ts`, `src/context/abstractions/IWebsocketsContext.ts` |
| Runner + routes | `src/runner/` (connect, disconnect, default) |
| Response | `src/response/` |
| Plugins | `src/plugins/` |
| GraphQL | `src/graphql/` |

### Consumer usage (from `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`)

```ts
import { createWebsockets } from "@webiny/api-websockets";
import { registerWebsocketsDdbStorageOperations } from "@webiny/api-websockets-ddb";
// ...
createWebsockets(),
registerWebsocketsDdbStorageOperations({ documentClient }),
```

## Target State

### Package landscape

```
packages/api-websockets        — abstractions + runner + context + graphql + plugins (NO AWS deps)
packages/api-websockets-aws    — NEW: AWS Lambda handler + API Gateway transport + event validator
packages/api-websockets-ddb    — DynamoDB connection registry (updated for new registry data shape)
packages/api-websockets-sql    — SQL connection registry (updated for new registry data shape)
packages/app-websockets        — unchanged
```

### Dependency graph

```
api-websockets-aws  ──depends on──→  api-websockets  ←──depends on──  api-websockets-ddb
                                                       ←──depends on──  api-websockets-sql
```

All three satellite packages depend on `api-websockets` for abstractions. They are independent of each other. The consumer wires all needed packages together.

### Consumer usage (target)

```ts
import { createWebsockets } from "@webiny/api-websockets";
import { createAwsWebsockets } from "@webiny/api-websockets-aws";
import { registerWebsocketsDdbStorageOperations } from "@webiny/api-websockets-ddb";
// ...
createWebsockets(),
createAwsWebsockets(),
registerWebsocketsDdbStorageOperations({ documentClient }),
```

## Design Decisions

### 1. Generic event types replace AWS enums

**Current:** `WebsocketsEventRoute` enum (`"$connect"`, `"$disconnect"`, `"$default"`) and `WebsocketsEventRequestContextEventType` enum (`"MESSAGE"`, `"CONNECT"`, `"DISCONNECT"`).

**New:** String literal union types with generic names:

```ts
/* Route identifies the WebSocket lifecycle phase or message channel.
   "connect" and "disconnect" are lifecycle routes; "default" handles application messages.
   Custom routes (string) are also allowed for user-defined message routing. */
type WebsocketsRoute = "connect" | "disconnect" | "default";

/* Classifies the event: a lifecycle signal or an application message.
   "connect"/"disconnect" fire once per connection lifecycle.
   "message" fires for every application-level frame. */
type WebsocketsEventType = "message" | "connect" | "disconnect";
```

The AWS package maps its native values (`$connect` → `"connect"`, `MESSAGE` → `"message"`, etc.) during validation.

### 2. Generic event shape

**Current `IWebsocketsEvent`:** has `requestContext` with `connectionId`, `connectedAt`, `domainName`, `eventType`, `routeKey`, `stage`.

**New `IWebsocketsEvent`:**

```ts
interface IWebsocketsEventContext {
    /* Unique identifier for this WebSocket connection, assigned by the server infrastructure.
       AWS: API Gateway connectionId. Server: implementation-defined unique ID. */
    connectionId: string;
    /* Unix timestamp (ms) when the connection was established. */
    connectedAt: number;
    /* Hostname or address of the WebSocket endpoint.
       Used for display/logging, NOT for transport routing — see `endpoint` on registry data.
       AWS: API Gateway domainName. Server: the server's hostname. */
    host: string;
    /* Event classification: lifecycle signal or application message. */
    eventType: WebsocketsEventType;
    /* Route key identifying which handler should process this event.
       AWS: mapped from routeKey ($connect → "connect"). Server: derived from frame data. */
    route: WebsocketsRoute | string;
    /* Pre-built transport endpoint URL for sending messages back to this connection.
       AWS: "https://{domainName}/{stage}". Server: "ws://host:port" or similar.
       This value is stored in the connection registry and passed to the transport. */
    endpoint: string;
}

interface IWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: Record<string, string>;
    context: IWebsocketsEventContext;
    body?: T;
}
```

Key changes:
- `requestContext` → `context` (shorter, not AWS-specific).
- `domainName` → `host` (generic networking term, for display/logging only).
- `routeKey` → `route`.
- `stage` removed from the generic type (AWS-only; captured in `endpoint`).
- **`endpoint` added to event context** — the AWS validator constructs it during validation as `https://{domainName}/{stage}`. This flows through the event to the connect route plugin, which writes it into the connection registry. This solves the design gap where the platform-agnostic connect plugin needs to produce the endpoint without knowing the provider.

### 3. Single `endpoint` in connection registry data

**Current `IWebsocketsConnectionRegistryData`:** has `domainName: string` and `stage: string`.

**New:**

```ts
interface IWebsocketsConnectionRegistryData {
    connectionId: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    connectedOn: string;
    /* Pre-built transport endpoint for sending messages to this connection.
       AWS: "https://{domainName}/{stage}". Server: "ws://host:port". */
    endpoint: string;
}
```

The `register` params also change: `domainName` + `stage` → `endpoint`.

The `IWebsocketsTransportSendConnection` and `IWebsocketsTransportDisconnectConnection` types are updated accordingly (they are `Pick` from registry data):

```ts
type IWebsocketsTransportSendConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;

type IWebsocketsTransportDisconnectConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;
```

### 4. DI abstraction for transport

New abstraction token following the existing `ConnectionRegistry` pattern:

```ts
/* file: src/features/Transport/abstractions.ts */
import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsTransport } from "~/transport/abstractions/IWebsocketsTransport.js";

export const Transport = createAbstraction<IWebsocketsTransport>("WebsocketsTransport");

export namespace Transport {
    export type Interface = IWebsocketsTransport;
}
```

`createWebsocketsContext()` resolves transport from DI:

```ts
const transport = context.container.resolve(Transport);
```

The AWS package registers its implementation:

```ts
context.container.registerInstance(Transport, new AwsWebsocketsTransport());
```

### 5. Validator stays as abstraction, returns generic event

`IWebsocketsEventValidator` remains in the base package. Its contract changes:

```ts
/* Validates and transforms a raw provider-specific input into a generic IWebsocketsEvent.
   Each provider implements this to handle its native event shape.
   The input is `unknown` because the raw shape is provider-defined. */
interface IWebsocketsEventValidator {
    validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>>;
}
```

The `IWebsocketsEventValidatorValidateParams` type alias is removed — the input is `unknown`.

A `Validator` DI abstraction token is added (same pattern as Transport and ConnectionRegistry) so the runner can resolve it if needed, but primarily the handler calls the validator.

### 6. Transport abstraction update

`IWebsocketsTransport.send()` and `.disconnect()` connection params use `endpoint` instead of `domainName` + `stage`:

```ts
interface IWebsocketsTransportSendConnection {
    connectionId: string;
    /* Pre-built endpoint URL for the transport to use.
       AWS: "https://{domainName}/{stage}". Server: provider-specific. */
    endpoint: string;
}

interface IWebsocketsTransportDisconnectConnection {
    connectionId: string;
    endpoint: string;
}
```

The AWS transport uses `endpoint` directly as the `ApiGatewayManagementApiClient` endpoint instead of constructing it from `domainName`/`stage`. Client caching by endpoint still works — the cache key is the endpoint string.

### 7. Validation error handling: handler responsibility

**Problem:** The runner currently calls the validator internally and, on validation failure, attempts a best-effort error response back to the WebSocket client using raw `input.requestContext` fields (connectionId, domainName, stage). Moving validation out of the runner would lose this error-reporting path.

**Solution:** Validation moves to the handler (in `api-websockets-aws`). The handler is responsible for:

1. Calling the validator to transform the raw AWS event into a generic `IWebsocketsEvent`.
2. On validation success: passing the generic event to `runner.run()`.
3. On validation failure: using the transport directly to send an error response back to the client (if connectionId/domainName/stage are available in the raw event). This is provider-specific behavior — the AWS handler knows the raw event shape and can extract connection info for error responses even when the full event fails validation.

The runner's `run()` signature changes to accept a pre-validated `IWebsocketsEvent`:

```ts
interface IWebsocketsRunner {
    run(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse>;
}
```

The runner no longer imports or uses `IWebsocketsIncomingEvent`. Its internal `respond()` method uses `event.context.connectionId`, `event.context.host`, `event.context.endpoint`, and `event.context.eventType` (all from the generic event).

### 8. `createAwsWebsockets()` public API

Single function exported from `api-websockets-aws`:

```ts
export const createAwsWebsockets = (): Plugin[] => {
    /* Returns plugins that:
       1. Register the AWS Lambda source handler (handler detection + routing).
       2. Register the AWS transport via DI (ApiGatewayManagementApiClient-based).
       3. Register the AWS event validator via DI (zod schema for API Gateway events). */
};
```

### 9. GraphQL schema update

The `WebsocketsConnection` GraphQL type changes:

**Before:**
```graphql
type WebsocketsConnection {
    connectionId: String!
    domainName: String!
    stage: String!
    identity: WebsocketsIdentity!
    connectedOn: DateTime!
    tenant: String!
}
```

**After:**
```graphql
type WebsocketsConnection {
    connectionId: String!
    endpoint: String!
    identity: WebsocketsIdentity!
    connectedOn: DateTime!
    tenant: String!
}
```

`domainName` and `stage` are replaced by `endpoint`. This is a GraphQL breaking change — clients querying these fields will get errors.

### 10. SQL storage migration

The `api-websockets-sql` package's `ensureTable()` creates a DDL schema with `domainName` and `stage` columns. After the change:

- `domainName` and `stage` columns are replaced by a single `endpoint` column.
- `ensureTable()` only creates the table if it doesn't exist — it will not alter existing tables.
- A migration helper is added alongside `ensureTable()` that checks for the old schema and performs an `ALTER TABLE` to:
  1. Add the `endpoint` column (nullable initially).
  2. Backfill `endpoint` from `CONCAT('https://', domainName, '/', stage)` for existing rows.
  3. Drop the `domainName` and `stage` columns.
  4. Make `endpoint` NOT NULL.

This migration runs lazily on first access (same pattern as `ensureTable()`). If the table already has an `endpoint` column, migration is skipped.

## File Inventory

### Files that move to `api-websockets-aws`

| Current location | New location |
|---|---|
| `src/transport/WebsocketsTransport.ts` | `api-websockets-aws/src/transport/AwsWebsocketsTransport.ts` |
| `src/validator/WebsocketsEventValidator.ts` | `api-websockets-aws/src/validator/AwsWebsocketsEventValidator.ts` |
| `src/handler/handler.ts` | `api-websockets-aws/src/handler/handler.ts` |
| `src/handler/register.ts` | `api-websockets-aws/src/handler/register.ts` |
| `src/handler/types.ts` | `api-websockets-aws/src/handler/types.ts` |
| `src/handler/headers.ts` | `api-websockets-aws/src/handler/headers.ts` |
| `__tests__/handler/handler.test.ts` | `api-websockets-aws/__tests__/handler/handler.test.ts` |
| `__tests__/handler/register.test.ts` | `api-websockets-aws/__tests__/handler/register.test.ts` |
| `__tests__/transport/WebsocketsTransport.test.ts` | `api-websockets-aws/__tests__/transport/AwsWebsocketsTransport.test.ts` |
| `__tests__/validator/WebsocketsEventValidator.test.ts` | `api-websockets-aws/__tests__/validator/AwsWebsocketsEventValidator.test.ts` |
| `__tests__/mocks/event.ts` | `api-websockets-aws/__tests__/mocks/event.ts` (AWS event shape) |
| `__tests__/mocks/lambdaContext.ts` | `api-websockets-aws/__tests__/mocks/lambdaContext.ts` |

### Files that stay in `api-websockets` (modified)

| File | Change |
|---|---|
| `src/types.ts` | Add generic event types (`WebsocketsRoute`, `WebsocketsEventType`, `IWebsocketsEventContext`, `IWebsocketsEvent`, `IWebsocketsEventData`). Note: this file currently only has `Context`, `WebsocketsPermission`, and `IWebsocketsContextObject` — the event types are new additions here, not moves within the same package. `IWebsocketsEventData` is extracted from `src/handler/types.ts` (which moves to `api-websockets-aws`). |
| `src/index.ts` | Remove `import "./handler/register.js"` side-effect. Update re-exports: remove transport class, remove validator class. Add export of `Transport` feature abstraction. |
| `src/transport/abstractions/IWebsocketsTransport.ts` | Update `IWebsocketsTransportSendConnection` and `IWebsocketsTransportDisconnectConnection` to use `endpoint` instead of `domainName` + `stage`. |
| `src/transport/index.ts` | Remove re-export of `WebsocketsTransport` class. Only export abstractions. |
| `src/validator/abstractions/IWebsocketsEventValidator.ts` | Input type → `unknown`. Remove `IWebsocketsEventValidatorValidateParams` type alias. Return type uses new generic `IWebsocketsEvent`. Update imports from `~/types.js` instead of `~/handler/types.js`. |
| `src/validator/index.ts` | Remove re-export of `WebsocketsEventValidator` class. Only export abstractions. |
| `src/registry/abstractions/IWebsocketsConnectionRegistry.ts` | `domainName` + `stage` → `endpoint` in `IWebsocketsConnectionRegistryData` and `IWebsocketsConnectionRegistryRegisterParams`. |
| `src/runner/abstractions/IWebsocketsRunner.ts` | Input type → `IWebsocketsEvent` (from `~/types.js`). Remove `IWebsocketsIncomingEvent` import. |
| `src/runner/WebsocketsRunner.ts` | Remove validator dependency from constructor. Accept `IWebsocketsEvent` in `run()`. Remove the validation try/catch block (lines 63–99) entirely — validation is now the handler's responsibility. Update `executeRoute()`: change `event.requestContext.routeKey` → `event.context.route` (line 160). Update `respond()`: change `event.context.connectionId`, `event.context.endpoint`, `event.context.eventType`; the guard becomes `if (!connectionId \|\| !endpoint)`. Rewrite `IWebsocketsRunnerRespondParams` — currently `Pick<IWebsocketsEventRequestContext, "connectionId" \| "domainName" \| "stage" \| "eventType">` which references the AWS type. Replace with `Pick<IWebsocketsEventContext, "connectionId" \| "endpoint" \| "eventType">` (from `~/types.js`). Replace `WebsocketsEventRequestContextEventType.message` with `"message"`. Remove all imports from `~/handler/types.js`. Import types from `~/types.js`. |
| `src/runner/routes/connect.ts` | All 4 `event.requestContext.*` accesses change: `event.requestContext.connectionId` → `event.context.connectionId`, `event.requestContext.domainName` → `event.context.host`, `event.requestContext.stage` → (removed, captured in endpoint), `event.requestContext.connectedAt` → `event.context.connectedAt`. Pass `endpoint: event.context.endpoint` to `registry.register()`. Import route type from `~/types.js` instead of `~/handler/types.js`. |
| `src/runner/routes/disconnect.ts` | Import route type from `~/types.js` instead of `~/handler/types.js`. Update `event.requestContext.connectionId` → `event.context.connectionId`. |
| `src/runner/routes/default.ts` | Same import path change. |
| `src/runner/routes/index.ts` | No change (just re-exports). |
| `src/context/index.ts` | Resolve transport from DI (`context.container.resolve(Transport)`) instead of `new WebsocketsTransport()`. Remove `WebsocketsTransport` import. Add `Transport` import from features. |
| `src/context/WebsocketsContext.ts` | No code change needed — it works against `IWebsocketsTransport` interface and `IWebsocketsConnectionRegistryData`. The type changes flow through automatically. |
| `src/context/abstractions/IWebsocketsContext.ts` | No code change — uses `IWebsocketsTransportSendConnection` which updates via its Pick type. |
| `src/plugins/WebsocketsRoutePlugin.ts` | Update imports to use types from `~/types.js` instead of `~/handler/types.js`. Route type becomes `WebsocketsRoute \| string`. |
| `src/plugins/abstrations/IWebsocketsActionPlugin.ts` | Check and update if it imports from `~/handler/types.js`. |
| `src/graphql/createTypeDefs.ts` | Replace `domainName: String!` and `stage: String!` with `endpoint: String!` in `WebsocketsConnection` type. |
| `src/graphql/createResolvers.ts` | No change needed — resolvers pass through registry data objects which will have the new shape. |
| `src/exports/api.ts` | No change. |
| `package.json` | Remove `@webiny/aws-sdk`, `@webiny/handler-aws`, `type-fest`, `zod` from production dependencies (all move to `api-websockets-aws`). Move `@webiny/handler-aws` to devDependencies (needed by `__tests__/helpers/useGraphQLHandler.ts`). |

### Files that stay in `api-websockets` (new)

| File | Purpose |
|---|---|
| `src/features/Transport/abstractions.ts` | DI abstraction token for transport |
| `src/features/Transport/index.ts` | Barrel re-export from `abstractions.ts` (follows `ConnectionRegistry` and `WebsocketService` pattern) |

### Test files in `api-websockets` that need updates

| File | Change |
|---|---|
| `__tests__/mocks/MockWebsocketsTransport.ts` | Update connection types to use `endpoint` instead of `domainName` + `stage`. |
| `__tests__/mocks/MockWebsocketsEventValidator.ts` | Update to return generic `IWebsocketsEvent` with `context` instead of `requestContext`. Input type → `unknown`. |
| `__tests__/mocks/event.ts` | If this file stays in base package: create new generic mock events using `WebsocketsRoute` / `WebsocketsEventType` string literals. The AWS-specific mock events move to `api-websockets-aws`. |
| `__tests__/types.ts` | Update if it references `IWebsocketsIncomingEvent` or AWS event types. |
| `__tests__/context/websocketsContext.test.ts` | Update to use generic event shape if it constructs events directly. |
| `__tests__/runner/websocketsRunner.test.ts` | Remove validator from runner constructor. Update event shapes to generic. Update expected error messages (e.g., `"$disconnect"` → `"disconnect"`). Remove validation-failure test cases (those move to the handler tests in `api-websockets-aws`). |
| `__tests__/registry/websocketsConnectionRegistry.test.ts` | Update registry data to use `endpoint` instead of `domainName` + `stage`. |
| `__tests__/helpers/graphql/connections.ts` | Replace `domainName` and `stage` field selections with `endpoint` in all GraphQL query/mutation strings (5 occurrences at lines 28–29, 72–73, 116–117, 160–161, 201–202). |
| `__tests__/helpers/plugins.ts` | Check and update if it creates events with AWS shapes. |
| `__tests__/helpers/useHandler.ts` | Check — may need to move to `api-websockets-aws` if it uses `createHandler`. |
| `__tests__/helpers/useGraphQLHandler.ts` | Uses `createHandler` from `@webiny/handler-aws/gateway` and `APIGatewayEvent`/`LambdaContext` from `@webiny/handler-aws/types`. This file stays in the base package (it tests GraphQL, not the Lambda source handler). `@webiny/handler-aws` must remain as a **devDependency** in `api-websockets` for this test helper. No import changes needed — the file uses the handler-aws gateway for test infrastructure, not for production code. |

### Files in `api-websockets-ddb` that need updates

| File | Change |
|---|---|
| `src/WebsocketsConnectionRegistry.ts` | `domainName` + `stage` → `endpoint` in `register()` data construction and `store()`. |
| `src/entity.ts` | No change (stores `data` as opaque map in DynamoDB). |

### Files in `api-websockets-sql` that need updates

| File | Change |
|---|---|
| `src/WebsocketsConnectionRegistry.ts` | `ConnectionRow` type: `domainName` + `stage` → `endpoint`. Update `register()`, `toData()`, `ensureTable()` DDL. Add migration logic for existing tables. |

### New files in `api-websockets-aws`

| File | Purpose |
|---|---|
| `package.json` | Depends on `@webiny/api-websockets`, `@webiny/handler-aws`, `@webiny/aws-sdk`, `@webiny/handler`, `@webiny/plugins`, `@webiny/error`, `@webiny/utils`, `zod`, `type-fest` |
| `tsconfig.json` | TypeScript config |
| `tsconfig.build.json` | Build config |
| `webiny.config.js` | Webiny build config |
| `src/index.ts` | Side-effect import of `./handler/register.js`. Exports `createAwsWebsockets()`. Re-exports AWS-specific types. |
| `src/exports/api.ts` | Public API export |
| `src/transport/AwsWebsocketsTransport.ts` | API Gateway Management API transport (uses `endpoint` directly as client endpoint, caches clients by endpoint string) |
| `src/validator/AwsWebsocketsEventValidator.ts` | Zod validation for API Gateway events. Maps AWS fields to generic: `$connect` → `"connect"`, `MESSAGE` → `"message"`, `domainName`/`stage` → `endpoint`. |
| `src/handler/handler.ts` | Lambda handler factory. Calls validator, handles validation errors (sends error response via transport using raw event connectionId/domainName/stage), passes validated event to runner. |
| `src/handler/register.ts` | Source handler registration with `@webiny/handler-aws/registry` |
| `src/handler/types.ts` | AWS-specific types: `IAwsWebsocketsIncomingEvent`, `IAwsWebsocketsEventRequestContext`, `IWebsocketsEventHeaders`, `IWebsocketsEventQueryStringParameters`, `WebsocketsEventRoute` enum (with `$connect`/`$disconnect`/`$default` values), `WebsocketsEventRequestContextEventType` enum, `HandlerCallable`. `IWebsocketsEventData` is extracted from the current `handler/types.ts` and moved to the base package's `src/types.ts` — it must be removed from this file to avoid duplicate exports. `HandlerParams` is updated: remove `validator` field (handler creates the validator internally), keep `response` field. Signature becomes `HandlerParams extends HandlerFactoryParams { response?: IWebsocketsResponse }`. |
| `src/handler/headers.ts` | Event value extraction (tenant, token from AWS event format) |
| `vitest.config.ts` | Test config |

### Consumer template updates

| File | Change |
|---|---|
| `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts` | Add `import { createAwsWebsockets } from "@webiny/api-websockets-aws"` and `createAwsWebsockets()` call. |
| `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts` | Same. |
| `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts` | Same. |

## Breaking Changes

1. **`IWebsocketsConnectionRegistryData`** shape: `domainName` + `stage` → `endpoint`. Affects `api-websockets-ddb`, `api-websockets-sql`, and any code reading registry data.
2. **`IWebsocketsTransportSendConnection`** / **`IWebsocketsTransportDisconnectConnection`**: same field change (`domainName` + `stage` → `endpoint`).
3. **Route values**: `"$connect"` → `"connect"`, `"$disconnect"` → `"disconnect"`, `"$default"` → `"default"`. Affects any custom `WebsocketsRoutePlugin` registrations.
4. **Event type values**: `"MESSAGE"` → `"message"`, `"CONNECT"` → `"connect"`, `"DISCONNECT"` → `"disconnect"`.
5. **Event shape**: `event.requestContext.*` → `event.context.*`. `domainName` → `host`. `routeKey` → `route`. New `endpoint` field.
6. **Import paths**: `WebsocketsTransport` class, `WebsocketsEventValidator` class, all handler types move to `@webiny/api-websockets-aws`.
7. **Consumer wiring**: must add `createAwsWebsockets()` call alongside existing `createWebsockets()`.
8. **GraphQL schema**: `WebsocketsConnection` type loses `domainName` and `stage` fields, gains `endpoint` field.
9. **Runner constructor**: no longer takes a validator. `run()` accepts `IWebsocketsEvent` instead of `IWebsocketsIncomingEvent`.
10. **Base package dependencies**: `@webiny/aws-sdk`, `@webiny/handler-aws`, `zod`, `type-fest` removed from `api-websockets` production dependencies. `@webiny/handler-aws` remains as a **devDependency** for `__tests__/helpers/useGraphQLHandler.ts`.
11. **`WebsocketService.Connection` type**: This is a public type alias for `IWebsocketsConnectionRegistryData` (in `src/features/WebsocketService/abstractions.ts`). When the registry data shape changes (`domainName` + `stage` → `endpoint`), this alias silently breaks consumers reading `.domainName` or `.stage` from `WebsocketService.Connection`.

## Out of Scope

- `api-websockets-server` package (future work).
- Changes to `app-websockets` (frontend package is transport-agnostic).
