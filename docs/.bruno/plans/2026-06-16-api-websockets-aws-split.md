# Split `api-websockets` into Base + AWS Provider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all AWS-specific code from `packages/api-websockets` into a new `packages/api-websockets-aws` package so the base package is platform-agnostic.

**Architecture:** The base package keeps abstractions, runner, context, GraphQL, and plugins. The new AWS package provides the Lambda handler, API Gateway transport, and event validator. DI tokens wire the AWS implementations at runtime. Generic event types replace AWS enums (`$connect` → `"connect"`, `MESSAGE` → `"message"`). Connection registry data replaces `domainName` + `stage` with a single `endpoint` string.

**Tech Stack:** TypeScript, Zod (validation), DI via `@webiny/feature`, DynamoDB + SQL storage, Vitest

**Spec:** `ai-context/specs/api-websockets-split.md`

---

## Phase 1: Base Package — Generic Types and Abstractions

### Task 1: Add generic event types to `src/types.ts`

**Files:**
- Modify: `packages/api-websockets/src/types.ts`

- [ ] **Step 1: Add the generic event types**

`IWebsocketsEventData` is extracted from `src/handler/types.ts:26-32`. The rest are new types.

```typescript
/* packages/api-websockets/src/types.ts */
import type { DbContext } from "@webiny/handler-db/types.js";
import type { IWebsocketsContextObject } from "./context/abstractions/IWebsocketsContext.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type { IWebsocketsContextObject };

export interface Context extends DbContext, ApiCoreContext {
    websockets: IWebsocketsContextObject;
}

export interface WebsocketsPermission extends SecurityPermission {
    name: "websockets";
    rwd?: string;
}

export type WebsocketsRoute = "connect" | "disconnect" | "default";

export type WebsocketsEventType = "message" | "connect" | "disconnect";

export interface IWebsocketsEventData {
    token?: string;
    tenant?: string;
    messageId?: string;
    action?: string;
    data?: GenericRecord;
}

export interface IWebsocketsEventContext {
    connectionId: string;
    connectedAt: number;
    host: string;
    eventType: WebsocketsEventType;
    route: WebsocketsRoute | string;
    endpoint: string;
}

export interface IWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: Record<string, string>;
    context: IWebsocketsEventContext;
    body?: T;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/types.ts
git commit -m "refactor(api-websockets): add generic event types to types.ts"
```

### Task 2: Create Transport DI abstraction

**Files:**
- Create: `packages/api-websockets/src/features/Transport/abstractions.ts`
- Create: `packages/api-websockets/src/features/Transport/index.ts`

- [ ] **Step 1: Create the Transport abstraction**

```typescript
/* packages/api-websockets/src/features/Transport/abstractions.ts */
import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsTransport } from "~/transport/abstractions/IWebsocketsTransport.js";

export const Transport = createAbstraction<IWebsocketsTransport>("WebsocketsTransport");

export namespace Transport {
    export type Interface = IWebsocketsTransport;
}
```

- [ ] **Step 2: Create the barrel**

```typescript
/* packages/api-websockets/src/features/Transport/index.ts */
export { Transport } from "./abstractions.js";
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-websockets/src/features/Transport/
git commit -m "refactor(api-websockets): add Transport DI abstraction"
```

### Task 3: Update registry abstraction — `endpoint` replaces `domainName` + `stage`

**Files:**
- Modify: `packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts`

- [ ] **Step 1: Update the registry types**

```typescript
/* packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts */
import type { IWebsocketsIdentity } from "~/context/abstractions/IWebsocketsContext.js";

export interface IWebsocketsConnectionRegistryData {
    connectionId: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    connectedOn: string;
    endpoint: string;
}

export interface IWebsocketsConnectionRegistryRegisterParams {
    connectionId: string;
    tenant: string;
    identity: IWebsocketsIdentity;
    endpoint: string;
    connectedOn: string;
}

export interface IWebsocketsConnectionRegistryUnregisterParams {
    connectionId: string;
}

export interface IWebsocketsConnectionRegistry {
    register(
        event: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData>;
    unregister(event: IWebsocketsConnectionRegistryUnregisterParams): Promise<void>;

    listViaConnections(connections: string[]): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listAll(): Promise<IWebsocketsConnectionRegistryData[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts
git commit -m "refactor(api-websockets): replace domainName+stage with endpoint in registry"
```

### Task 4: Update transport abstraction — `endpoint` replaces `domainName` + `stage`

**Files:**
- Modify: `packages/api-websockets/src/transport/abstractions/IWebsocketsTransport.ts`

- [ ] **Step 1: Update transport connection types**

```typescript
/* packages/api-websockets/src/transport/abstractions/IWebsocketsTransport.ts */
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";

export interface IWebsocketsTransportSendDataError {
    message: string;
    code: string;
    data?: GenericRecord;
    stack?: string;
}

export interface IWebsocketsTransportSendData<T extends GenericRecord> {
    messageId?: string;
    action?: string;
    data?: T;
    error?: IWebsocketsTransportSendDataError;
}

export type IWebsocketsTransportSendConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;

export type IWebsocketsTransportDisconnectConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;

export interface IWebsocketsTransport {
    send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;

    disconnect(connections: IWebsocketsTransportDisconnectConnection[]): Promise<void>;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/transport/abstractions/IWebsocketsTransport.ts
git commit -m "refactor(api-websockets): use endpoint in transport connection types"
```

### Task 5: Update validator abstraction — generic input

**Files:**
- Modify: `packages/api-websockets/src/validator/abstractions/IWebsocketsEventValidator.ts`

- [ ] **Step 1: Update the validator interface**

```typescript
/* packages/api-websockets/src/validator/abstractions/IWebsocketsEventValidator.ts */
import type {
    IWebsocketsEvent,
    IWebsocketsEventData
} from "~/types.js";

export interface IWebsocketsEventValidator {
    validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>>;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/validator/abstractions/IWebsocketsEventValidator.ts
git commit -m "refactor(api-websockets): make validator input generic (unknown)"
```

### Task 6: Update runner abstraction — accept generic event

**Files:**
- Modify: `packages/api-websockets/src/runner/abstractions/IWebsocketsRunner.ts`

- [ ] **Step 1: Update runner interface**

```typescript
/* packages/api-websockets/src/runner/abstractions/IWebsocketsRunner.ts */
import type { IWebsocketsEvent } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IWebsocketsResponseError {
    message: string;
    code: string;
    data?: GenericRecord<string> | null;
    stack?: string;
}
export interface IWebsocketsRunnerResponse {
    statusCode: number;
    message?: string;
    error?: IWebsocketsResponseError;
}

export interface IWebsocketsRunner {
    run(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse>;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/runner/abstractions/IWebsocketsRunner.ts
git commit -m "refactor(api-websockets): runner accepts generic IWebsocketsEvent"
```

## Phase 2: Base Package — Implementation Updates

### Task 7: Rewrite `WebsocketsRunner.ts`

**Files:**
- Modify: `packages/api-websockets/src/runner/WebsocketsRunner.ts`

- [ ] **Step 1: Rewrite the runner**

Remove validator from constructor, remove validation try/catch block, update all `event.requestContext.*` to `event.context.*`, rewrite `IWebsocketsRunnerRespondParams`, update `executeRoute` to use `event.context.route`.

```typescript
/* packages/api-websockets/src/runner/WebsocketsRunner.ts */
import WebinyError from "@webiny/error";
import type {
    IWebsocketsEvent,
    IWebsocketsEventContext,
    IWebsocketsEventData
} from "~/types.js";
import type { Context } from "~/types.js";
import type {
    IWebsocketsRunner,
    IWebsocketsRunnerResponse
} from "./abstractions/IWebsocketsRunner.js";
import type { IWebsocketsRoutePluginCallableParams } from "~/plugins/index.js";
import { WebsocketsRoutePlugin } from "~/plugins/index.js";
import { middleware } from "~/utils/middleware.js";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type {
    IWebsocketsResponse,
    IWebsocketsResponseErrorResult,
    IWebsocketsResponseOkResult
} from "~/response/index.js";
import type { IWebsocketsTransportSendConnection } from "~/transport/index.js";
import type { IWebsocketsIdentity } from "~/context/index.js";
import type { WebsocketsRoute } from "~/types.js";

type MiddlewareParams<C extends Context = Context> = Pick<
    IWebsocketsRoutePluginCallableParams<C>,
    "context" | "event" | "registry"
>;

interface IWebsocketsRunnerRespondParams extends Pick<
    IWebsocketsEventContext,
    "connectionId" | "endpoint" | "eventType"
> {
    messageId?: string;
    result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
}

export class WebsocketsRunner implements IWebsocketsRunner {
    private readonly context: Context;
    private readonly registry: IWebsocketsConnectionRegistry;
    private readonly response: IWebsocketsResponse;

    public constructor(
        context: Context,
        registry: IWebsocketsConnectionRegistry,
        response: IWebsocketsResponse
    ) {
        this.context = context;
        this.registry = registry;
        this.response = response;
    }

    public async run<T extends IWebsocketsEventData = IWebsocketsEventData>(
        event: IWebsocketsEvent<T>
    ): Promise<IWebsocketsRunnerResponse> {
        let result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
        try {
            result = await this.executeRoute(event);
        } catch (ex) {
            result = this.response.error({
                message: `Route "${event.context.route}" action failed.`,
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            });
        }
        try {
            await this.respond({
                connectionId: event.context.connectionId,
                endpoint: event.context.endpoint,
                eventType: event.context.eventType,
                messageId: event.body?.messageId,
                result
            });
            return result;
        } catch (ex) {
            return this.response.error({
                message: "Failed to respond to the request.",
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: {
                        ...ex.data,
                        result
                    },
                    stack: ex.stack
                }
            });
        }
    }

    private getRoutePlugins(route: WebsocketsRoute | string): WebsocketsRoutePlugin[] {
        const plugins = this.context.plugins
            .byType<WebsocketsRoutePlugin>(WebsocketsRoutePlugin.type)
            .filter(plugin => {
                return plugin.route === route;
            });
        if (plugins.length === 0) {
            throw new WebinyError(
                `There are no plugins for the route: ${route}.`,
                "NO_ROUTE_PLUGINS",
                {
                    route
                }
            );
        }
        return plugins;
    }

    private async executeRoute(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse> {
        const plugins = this.getRoutePlugins(event.context.route).reverse();

        const getTenant = () => {
            const tenant = this.context.tenancy.getCurrentTenant();
            return tenant?.id || null;
        };

        const getIdentity = (): IWebsocketsIdentity | null => {
            const identity = this.context.security.getIdentity();
            return identity || null;
        };

        const action = middleware<MiddlewareParams, IWebsocketsRunnerResponse>(
            plugins.map(plugin => {
                return async (params, next) => {
                    return plugin.run({
                        registry: params.registry,
                        event: params.event,
                        context: params.context,
                        getTenant,
                        getIdentity,
                        response: this.response,
                        next
                    });
                };
            })
        );

        const result = await action({
            event,
            registry: this.registry,
            context: this.context
        });
        if (result) {
            return result;
        }
        const message = "No response from the route action.";
        return this.response.error({
            message,
            error: {
                message,
                code: "NO_RESPONSE"
            },
            statusCode: 404
        });
    }

    private async respond(params: IWebsocketsRunnerRespondParams): Promise<void> {
        const { connectionId, endpoint, eventType, result, messageId } = params;
        if (eventType !== "message") {
            return;
        } else if (!connectionId || !endpoint) {
            const message = "No connectionId or endpoint.";
            const data = {
                connectionId,
                endpoint
            };
            console.error(message, JSON.stringify(data));
            throw new WebinyError(message, "GENERAL_ERROR", data);
        }
        const connection: IWebsocketsTransportSendConnection = {
            connectionId,
            endpoint
        };

        const dataToSend = {
            ...result,
            messageId
        };
        await this.context.websockets.sendToConnections([connection], dataToSend);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/runner/WebsocketsRunner.ts
git commit -m "refactor(api-websockets): rewrite runner for generic event types"
```

### Task 8: Update route plugins

**Files:**
- Modify: `packages/api-websockets/src/runner/routes/connect.ts`
- Modify: `packages/api-websockets/src/runner/routes/disconnect.ts`
- Modify: `packages/api-websockets/src/runner/routes/default.ts`
- Modify: `packages/api-websockets/src/plugins/WebsocketsRoutePlugin.ts`

- [ ] **Step 1: Update connect route**

```typescript
/* packages/api-websockets/src/runner/routes/connect.ts */
import type { WebsocketsRoute } from "~/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const CONNECT: WebsocketsRoute = "connect";

const getConnectedOn = (connectedAt?: number) => {
    if (!connectedAt) {
        return new Date().toISOString();
    }
    return new Date(connectedAt).toISOString();
};

export const createWebsocketsRouteConnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(CONNECT, async params => {
        const { registry, event, response, getTenant, getIdentity } = params;

        const tenant = getTenant();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!identity) {
            return response.error({
                message: "Missing identity."
            });
        }

        await registry.register({
            identity: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            connectionId: event.context.connectionId,
            tenant,
            endpoint: event.context.endpoint,
            connectedOn: getConnectedOn(event.context.connectedAt)
        });

        return response.ok();
    });
    plugin.name = "websockets.route.connect.default";
    return plugin;
};
```

- [ ] **Step 2: Update disconnect route**

```typescript
/* packages/api-websockets/src/runner/routes/disconnect.ts */
import type { WebsocketsRoute } from "~/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const DISCONNECT: WebsocketsRoute = "disconnect";

export const createWebsocketsRouteDisconnectPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(DISCONNECT, async params => {
        const { registry, event, response } = params;
        await registry.unregister({
            connectionId: event.context.connectionId
        });

        return response.ok();
    });
    plugin.name = "websockets.route.disconnect.default";
    return plugin;
};
```

- [ ] **Step 3: Update default route**

```typescript
/* packages/api-websockets/src/runner/routes/default.ts */
import type { WebsocketsRoute } from "~/types.js";
import { createWebsocketsRoutePlugin } from "~/plugins/WebsocketsRoutePlugin.js";

const DEFAULT: WebsocketsRoute = "default";

export const createWebsocketsRouteDefaultPlugin = () => {
    const plugin = createWebsocketsRoutePlugin(DEFAULT, async params => {
        const { response, getIdentity, getTenant } = params;
        const tenant = getTenant();
        const identity = getIdentity();
        if (!tenant) {
            return response.error({
                message: "Missing tenant."
            });
        } else if (!identity) {
            return response.error({
                message: "Missing identity."
            });
        }

        return response.ok();
    });

    plugin.name = "websockets.route.default.default";
    return plugin;
};
```

- [ ] **Step 4: Update `WebsocketsRoutePlugin`**

Replace imports from `~/handler/types.js` with `~/types.js`:

```typescript
/* packages/api-websockets/src/plugins/WebsocketsRoutePlugin.ts */
import { Plugin } from "@webiny/plugins";
import type {
    IWebsocketsEvent,
    IWebsocketsEventData,
    WebsocketsRoute
} from "~/types.js";
import type { Context } from "~/types.js";
import type { IWebsocketsRunnerResponse } from "~/runner/index.js";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsResponse } from "~/response/abstractions/IWebsocketsResponse.js";
import type { IWebsocketsIdentity } from "~/context/index.js";

export interface IWebsocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    event: IWebsocketsEvent<T>;
    registry: IWebsocketsConnectionRegistry;
    context: C;
    response: IWebsocketsResponse;
    getTenant: () => string | null;
    getIdentity: () => IWebsocketsIdentity | null;
    next: () => Promise<R>;
}

export interface IWebsocketsRoutePluginCallable<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    (params: IWebsocketsRoutePluginCallableParams<C, R, T>): Promise<R>;
}

export class WebsocketsRoutePlugin<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> extends Plugin {
    public static override readonly type: string = "websockets.route";

    public readonly route: WebsocketsRoute | string;
    private readonly cb: IWebsocketsRoutePluginCallable<C, R, T>;

    public constructor(
        route: WebsocketsRoute | string,
        cb: IWebsocketsRoutePluginCallable<C, R, T>
    ) {
        super();
        this.route = route;
        this.cb = cb;
    }

    public async run(params: IWebsocketsRoutePluginCallableParams<C, R, T>): Promise<R> {
        return this.cb(params);
    }
}

export const createWebsocketsRoutePlugin = <
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
>(
    route: WebsocketsRoute | string,
    cb: IWebsocketsRoutePluginCallable<C, R, T>
) => {
    return new WebsocketsRoutePlugin<C, R, T>(route, cb);
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets/src/runner/routes/ packages/api-websockets/src/plugins/WebsocketsRoutePlugin.ts
git commit -m "refactor(api-websockets): update route plugins for generic event types"
```

### Task 9: Update context — resolve transport from DI

**Files:**
- Modify: `packages/api-websockets/src/context/index.ts`

- [ ] **Step 1: Replace `new WebsocketsTransport()` with DI resolution**

```typescript
/* packages/api-websockets/src/context/index.ts */
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WebsocketsContext as WebsocketsImplementation } from "./WebsocketsContext.js";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { Transport } from "~/features/Transport/abstractions.js";

export type * from "./abstractions/IWebsocketsContext.js";

export const createWebsocketsContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const registry = context.container.resolve(ConnectionRegistry);
        const transport = context.container.resolve(Transport);
        context.websockets = new WebsocketsImplementation(registry, transport);

        context.container.registerInstance(WebsocketService, context.websockets);
    });

    plugin.name = "websockets.context";

    return plugin;
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/context/index.ts
git commit -m "refactor(api-websockets): resolve transport from DI container"
```

### Task 10: Update barrel exports and GraphQL

**Files:**
- Modify: `packages/api-websockets/src/index.ts`
- Modify: `packages/api-websockets/src/transport/index.ts`
- Modify: `packages/api-websockets/src/validator/index.ts`
- Modify: `packages/api-websockets/src/graphql/createTypeDefs.ts`

- [ ] **Step 1: Update `src/index.ts`**

Remove the side-effect import and the transport/validator class exports. Add Transport feature export.

```typescript
/* packages/api-websockets/src/index.ts */
import type { Plugin } from "@webiny/plugins/types.js";
import { createWebsocketsContext } from "~/context/index.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const createWebsockets = (): Plugin[] => {
    return [createWebsocketsContext(), createWebsocketsGraphQL()];
};

export type * from "./validator/index.js";
export type * from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";
export * from "./context/index.js";
export * from "./features/ConnectionRegistry/abstractions.js";
export * from "./features/Transport/abstractions.js";

export * from "./plugins/index.js";
export type * from "./types.js";
```

- [ ] **Step 2: Update `src/transport/index.ts`**

Remove the class export, keep only type exports:

```typescript
/* packages/api-websockets/src/transport/index.ts */
export type * from "./abstractions/IWebsocketsTransport.js";
```

- [ ] **Step 3: Update `src/validator/index.ts`**

Remove the class export, keep only type exports:

```typescript
/* packages/api-websockets/src/validator/index.ts */
export type * from "./abstractions/IWebsocketsEventValidator.js";
```

- [ ] **Step 4: Update GraphQL type defs**

Replace `domainName` and `stage` with `endpoint`:

```typescript
/* packages/api-websockets/src/graphql/createTypeDefs.ts */
export const createTypeDefs = () => {
    return /* GraphQL */ `
        type WebsocketsIdentity {
            id: String!
            type: String
            displayName: String
        }
        type WebsocketsConnection {
            connectionId: String!
            endpoint: String!
            identity: WebsocketsIdentity!
            connectedOn: DateTime!
            tenant: String!
        }

        type WebsocketsError {
            message: String!
            code: String!
            data: JSON
        }

        type WebsocketsListConnectionsResponse {
            data: [WebsocketsConnection!]
            error: WebsocketsError
        }

        input WebsocketsListConnectionsWhereInput {
            identityId: String
            tenant: String
        }

        type WebsocketsDisconnectResponse {
            data: [WebsocketsConnection!]
            error: WebsocketsError
        }

        type WebsocketsQuery {
            _empty: String
        }

        type WebsocketsMutation {
            _empty: String
        }

        extend type Query {
            websockets: WebsocketsQuery
        }

        extend type Mutation {
            websockets: WebsocketsMutation
        }

        extend type WebsocketsQuery {
            listConnections(
                where: WebsocketsListConnectionsWhereInput
            ): WebsocketsListConnectionsResponse!
        }

        extend type WebsocketsMutation {
            disconnect(connections: [String!]!): WebsocketsDisconnectResponse!
            disconnectIdentity(identityId: String!): WebsocketsDisconnectResponse!
            disconnectTenant(tenant: String!): WebsocketsDisconnectResponse!
            disconnectAll: WebsocketsDisconnectResponse!
        }
    `;
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets/src/index.ts packages/api-websockets/src/transport/index.ts packages/api-websockets/src/validator/index.ts packages/api-websockets/src/graphql/createTypeDefs.ts
git commit -m "refactor(api-websockets): update barrels and GraphQL schema for generic types"
```

### Task 11: Update `package.json` — remove AWS deps from production

**Files:**
- Modify: `packages/api-websockets/package.json`

- [ ] **Step 1: Move AWS deps out of dependencies**

Remove `@webiny/aws-sdk`, `type-fest`, `zod` from `dependencies`. Move `@webiny/handler-aws` from `dependencies` to `devDependencies` (still needed by test helper).

```json
{
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
  "devDependencies": {
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/build-tools": "0.0.0",
    "@webiny/handler-aws": "0.0.0",
    "@webiny/handler-db": "0.0.0",
    "@webiny/handler-graphql": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "graphql": "^16.14.2",
    "rimraf": "^6.1.3",
    "typescript": "6.0.3",
    "vitest": "^4.1.8"
  }
}
```

Keep all other fields unchanged.

- [ ] **Step 2: Delete the moved source files**

These files are moving to `api-websockets-aws` in Phase 3. Delete them from the base package now:

```bash
rm packages/api-websockets/src/handler/handler.ts
rm packages/api-websockets/src/handler/register.ts
rm packages/api-websockets/src/handler/types.ts
rm packages/api-websockets/src/handler/headers.ts
rm packages/api-websockets/src/transport/WebsocketsTransport.ts
rm packages/api-websockets/src/validator/WebsocketsEventValidator.ts
rmdir packages/api-websockets/src/handler 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-websockets/
git commit -m "refactor(api-websockets): remove AWS deps and handler/transport/validator impls"
```

### Task 12: Build the base package and fix any issues

- [ ] **Step 1: Build**

```bash
yarn build -p @webiny/api-websockets 2>&1 | tail -30
```

Fix any compile errors that arise (missing imports, type mismatches). The `src/plugins/abstrations/IWebsocketsActionPlugin.ts` may reference `~/handler/types.js` — if so, update it to import from `~/types.js`.

- [ ] **Step 2: Commit any fixes**

```bash
git add packages/api-websockets/
git commit -m "fix(api-websockets): fix build errors after handler removal"
```

## Phase 3: New `api-websockets-aws` Package

### Task 13: Scaffold the new package

**Files:**
- Create: `packages/api-websockets-aws/package.json`
- Create: `packages/api-websockets-aws/tsconfig.json`
- Create: `packages/api-websockets-aws/tsconfig.build.json`
- Create: `packages/api-websockets-aws/webiny.config.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-websockets-aws",
  "version": "0.0.0",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git"
  },
  "description": "AWS Lambda handler and API Gateway transport for @webiny/api-websockets",
  "contributors": [
    "Bruno Zorić <bruno@webiny.com>"
  ],
  "exports": {
    "./*": "./*",
    ".": "./index.js"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-websockets": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/handler-aws": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0",
    "type-fest": "^5.7.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "6.0.3",
    "vitest": "^4.1.8"
  },
  "publishConfig": {
    "access": "public"
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "__tests__"],
  "references": [
    { "path": "../api" },
    { "path": "../api-websockets" },
    { "path": "../aws-sdk" },
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../handler" },
    { "path": "../handler-aws" },
    { "path": "../plugins" },
    { "path": "../utils" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src", "./__tests__"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "~tests/*": ["./__tests__/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-websockets/*": ["../api-websockets/src/*"],
      "@webiny/api-websockets": ["../api-websockets/src"],
      "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
      "@webiny/aws-sdk": ["../aws-sdk/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/api": ["../feature/src/api/index.js"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/handler/*": ["../handler/src/*"],
      "@webiny/handler": ["../handler/src"],
      "@webiny/handler-aws/*": ["../handler-aws/src/*"],
      "@webiny/handler-aws": ["../handler-aws/src"],
      "@webiny/plugins/*": ["../plugins/src/*"],
      "@webiny/plugins": ["../plugins/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create `tsconfig.build.json`**

Check a sibling package (e.g., `api-websockets-ddb`) for the build tsconfig pattern and replicate it. Typically:

```json
{
  "extends": "./tsconfig.json",
  "include": ["src"],
  "exclude": ["__tests__"],
  "compilerOptions": {
    "rootDir": "./src"
  }
}
```

- [ ] **Step 4: Create `webiny.config.js`**

```javascript
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-aws/
git commit -m "chore(api-websockets-aws): scaffold new package"
```

### Task 14: Move handler types to the AWS package

**Files:**
- Create: `packages/api-websockets-aws/src/handler/types.ts`

- [ ] **Step 1: Create AWS-specific handler types**

This file is based on the old `api-websockets/src/handler/types.ts` but:
- `IWebsocketsEventData` is removed (now lives in base `types.ts`)
- `HandlerParams` drops the `validator` field
- Types are renamed with `IAws` prefix where they conflict with base types

```typescript
/* packages/api-websockets-aws/src/handler/types.ts */
import type { HandlerFactoryParams } from "@webiny/handler-aws/types.js";
import type { IWebsocketsResponse } from "@webiny/api-websockets";
import type {
    APIGatewayProxyResult,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import type { IWebsocketsEventData } from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";
import type { PartialDeep } from "type-fest";

export interface HandlerCallable {
    (event: IAwsWebsocketsIncomingEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    response?: IWebsocketsResponse;
}

export enum WebsocketsEventRoute {
    "connect" = "$connect",
    "disconnect" = "$disconnect",
    "default" = "$default"
}

export enum WebsocketsEventRequestContextEventType {
    "message" = "MESSAGE",
    "connect" = "CONNECT",
    "disconnect" = "DISCONNECT"
}

export interface IAwsWebsocketsEventRequestContext {
    connectionId: string;
    connectedAt: number;
    domainName: string;
    eventType: WebsocketsEventRequestContextEventType;
    routeKey: WebsocketsEventRoute | string;
    stage: string;
}

export interface IAwsWebsocketsEventHeaders {
    "Accept-Encoding"?: string;
    "Accept-Language"?: string;
    "Cache-Control"?: string;
    Host?: string;
    Origin?: string;
    Pragma?: string;
    "Sec-WebSocket-Extensions"?: string;
    "Sec-WebSocket-Key"?: string;
    "Sec-WebSocket-Version"?: string;
    "Sec-WebSocket-Protocol"?: string;
    "User-Agent"?: string;
    "X-Amzn-Trace-Id"?: string;
    "X-Forwarded-For"?: string;
    "X-Forwarded-Port"?: `${number}`;
    "X-Forwarded-Proto"?: "https" | "http";
    ["x-tenant"]?: string;
    ["x-webiny-cms-endpoint"]?: string;
}

export interface IAwsWebsocketsEventQueryStringParameters {
    tenant?: string;
    token?: string;
}

export interface IAwsWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: IAwsWebsocketsEventHeaders;
    queryStringParameters?: IAwsWebsocketsEventQueryStringParameters;
    requestContext: IAwsWebsocketsEventRequestContext;
    body?: T;
}

export interface IAwsWebsocketsIncomingEvent extends PartialDeep<Omit<IAwsWebsocketsEvent, "body">> {
    body?: string | GenericRecord;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets-aws/src/handler/types.ts
git commit -m "feat(api-websockets-aws): add AWS handler types"
```

### Task 15: Move headers, validator, and transport to AWS package

**Files:**
- Create: `packages/api-websockets-aws/src/handler/headers.ts`
- Create: `packages/api-websockets-aws/src/validator/AwsWebsocketsEventValidator.ts`
- Create: `packages/api-websockets-aws/src/transport/AwsWebsocketsTransport.ts`

- [ ] **Step 1: Create `headers.ts`**

Same logic, updated type imports:

```typescript
/* packages/api-websockets-aws/src/handler/headers.ts */
import type { IWebsocketsEventData } from "@webiny/api-websockets";
import type { IAwsWebsocketsIncomingEvent } from "~/handler/types.js";

const getEventBody = (event: IAwsWebsocketsIncomingEvent): IWebsocketsEventData => {
    if (!event.body) {
        return {};
    } else if (typeof event.body === "object") {
        return event.body;
    } else if (typeof event.body === "string") {
        try {
            return JSON.parse(event.body);
        } catch (ex) {
            console.log(ex.message);
            return {};
        }
    }
    console.log("Unexpected event.body type:", typeof event.body);
    return {};
};

const getToken = (body: IWebsocketsEventData, event: IAwsWebsocketsIncomingEvent): string | null => {
    return body?.token || event.queryStringParameters?.token || null;
};

const getTenant = (body: IWebsocketsEventData, event: IAwsWebsocketsIncomingEvent): string => {
    return body?.tenant || event.queryStringParameters?.tenant || "root";
};

export const getEventValues = (event: IAwsWebsocketsIncomingEvent) => {
    const body = getEventBody(event);

    const token = getToken(body, event);
    const tenant = getTenant(body, event);
    return {
        tenant,
        token,
        endpoint: "manage"
    };
};
```

- [ ] **Step 2: Create `AwsWebsocketsEventValidator.ts`**

Validates the AWS event and maps to generic types:

```typescript
/* packages/api-websockets-aws/src/validator/AwsWebsocketsEventValidator.ts */
import zod from "zod";
import type { IWebsocketsEvent, IWebsocketsEventData } from "@webiny/api-websockets";
import type { IWebsocketsEventValidator } from "@webiny/api-websockets";
import { WebsocketsEventRequestContextEventType } from "~/handler/types.js";
import { createZodError } from "@webiny/utils";
import type { WebsocketsEventType } from "@webiny/api-websockets";

const eventTypeMap: Record<WebsocketsEventRequestContextEventType, WebsocketsEventType> = {
    [WebsocketsEventRequestContextEventType.message]: "message",
    [WebsocketsEventRequestContextEventType.connect]: "connect",
    [WebsocketsEventRequestContextEventType.disconnect]: "disconnect"
};

const routeKeyMap: Record<string, string> = {
    "$connect": "connect",
    "$disconnect": "disconnect",
    "$default": "default"
};

const validation = zod
    .object({
        headers: zod.looseObject({}).optional(),
        requestContext: zod.object({
            connectionId: zod.string(),
            stage: zod.string(),
            connectedAt: zod.number(),
            domainName: zod.string(),
            eventType: zod.enum([
                WebsocketsEventRequestContextEventType.connect,
                WebsocketsEventRequestContextEventType.message,
                WebsocketsEventRequestContextEventType.disconnect
            ]),
            routeKey: zod.string()
        }),
        body: zod
            .string()
            .transform<IWebsocketsEventData>((value, context) => {
                if (!value) {
                    return undefined;
                }
                try {
                    return JSON.parse(value);
                } catch (ex) {
                    console.error(`Failed body validation: ${ex.message}`);
                    console.log(`Body: ${value}`);
                    context.addIssue({
                        path: [],
                        message: `Invalid JSON: ${ex.message}`,
                        code: zod.ZodIssueCode.custom,
                        fatal: true
                    });
                }
            })
            .optional()
    })
    .superRefine((output, context) => {
        if (output.requestContext.eventType !== WebsocketsEventRequestContextEventType.message) {
            return;
        } else if (output.body) {
            return;
        }
        context.addIssue({
            path: ["body"],
            message: "There must be a body defined when having a message event.",
            code: zod.ZodIssueCode.custom,
            fatal: true
        });
    });

const bodyValidation = zod
    .looseObject({
        token: zod.string(),
        tenant: zod.string(),
        messageId: zod.string().nullish(),
        action: zod.string(),
        data: zod.looseObject({}).nullish()
    })
    .optional();

export class AwsWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>> {
        const result = await validation.safeParseAsync(input);
        if (!result.success) {
            throw createZodError(result.error);
        }
        const bodyResult = await bodyValidation.safeParseAsync(result.data.body);
        if (!bodyResult.success) {
            throw createZodError(bodyResult.error);
        }

        const rc = result.data.requestContext;

        return {
            headers: result.data.headers as Record<string, string>,
            context: {
                connectionId: rc.connectionId,
                connectedAt: rc.connectedAt,
                host: rc.domainName,
                eventType: eventTypeMap[rc.eventType as WebsocketsEventRequestContextEventType],
                route: routeKeyMap[rc.routeKey] || rc.routeKey,
                endpoint: `https://${rc.domainName}/${rc.stage}`
            },
            body: {
                ...((bodyResult.data || {}) as T)
            }
        };
    }
}
```

- [ ] **Step 3: Create `AwsWebsocketsTransport.ts`**

```typescript
/* packages/api-websockets-aws/src/transport/AwsWebsocketsTransport.ts */
import {
    ApiGatewayManagementApiClient,
    DeleteConnectionCommand,
    PostToConnectionCommand
} from "@webiny/aws-sdk/client-apigatewaymanagementapi/index.js";
import type {
    IWebsocketsTransport,
    IWebsocketsTransportDisconnectConnection,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";

export class AwsWebsocketsTransport implements IWebsocketsTransport {
    private readonly clients = new Map<string, ApiGatewayManagementApiClient>();

    public async send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            try {
                const client = this.getClient(connection.endpoint);

                const command = new PostToConnectionCommand({
                    ConnectionId: connection.connectionId,
                    Data: JSON.stringify(data)
                });
                await client.send(command);
            } catch (ex) {
                console.error(
                    `Failed to send message to connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    public async disconnect(connections: IWebsocketsTransportDisconnectConnection[]) {
        for (const connection of connections) {
            try {
                const client = this.getClient(connection.endpoint);
                const command = new DeleteConnectionCommand({
                    ConnectionId: connection.connectionId
                });
                await client.send(command);
            } catch (ex) {
                console.error(
                    `Failed to disconnect connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    private getClient(endpoint: string): ApiGatewayManagementApiClient {
        const client = this.clients.get(endpoint);
        if (client) {
            return client;
        }
        const newClient = new ApiGatewayManagementApiClient({
            endpoint
        });
        this.clients.set(endpoint, newClient);
        return newClient;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-websockets-aws/src/
git commit -m "feat(api-websockets-aws): add validator, transport, and headers"
```

### Task 16: Create handler and register, plus barrel exports

**Files:**
- Create: `packages/api-websockets-aws/src/handler/handler.ts`
- Create: `packages/api-websockets-aws/src/handler/register.ts`
- Create: `packages/api-websockets-aws/src/index.ts`
- Create: `packages/api-websockets-aws/src/exports/api.ts`

- [ ] **Step 1: Create `handler.ts`**

The handler calls the validator internally and handles validation errors:

```typescript
/* packages/api-websockets-aws/src/handler/handler.ts */
import type WebinyError from "@webiny/error";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins/index.js";
import { execute } from "@webiny/handler-aws/execute.js";
import { PluginsContainer } from "@webiny/plugins";
import { createWebsocketsRoutePlugins, WebsocketsRunner } from "@webiny/api-websockets";
import { WebsocketsResponse } from "@webiny/api-websockets/response/WebsocketsResponse.js";
import type { Context } from "@webiny/api-websockets";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { HandlerCallable, HandlerParams } from "./types.js";
import { getEventValues } from "./headers.js";
import { AwsWebsocketsEventValidator } from "~/validator/AwsWebsocketsEventValidator.js";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";
import { Transport } from "@webiny/api-websockets";

const url = "/webiny-websockets";

const createPluginsContainer = (
    plugins?: PluginsContainer | PluginCollection
): PluginsContainer => {
    if (plugins instanceof PluginsContainer) {
        return plugins;
    }
    return new PluginsContainer(plugins || []);
};

export const createHandler = (params: HandlerParams): HandlerCallable => {
    const plugins = createPluginsContainer(params.plugins);
    plugins.register(...createWebsocketsRoutePlugins());

    const validator = new AwsWebsocketsEventValidator();

    return async event => {
        const app = createBaseHandler({
            ...params,
            plugins,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });

        registerDefaultPlugins(app.webiny);

        await app.register(async wsApp => {
            wsApp.setErrorHandler<WebinyError>(async (error, _, reply) => {
                app.__webiny_raw_result = {
                    error: {
                        message: error.message,
                        code: error.code,
                        data: error.data
                    },
                    statusCode: 200
                };
                return reply.send({});
            });

            wsApp.post(url, async (_, reply) => {
                const { response } = params;
                const context = app.webiny as Context;

                context.container.registerInstance(Transport, new AwsWebsocketsTransport());

                const responseObj = response || new WebsocketsResponse();
                const runner = new WebsocketsRunner(
                    context,
                    context.websockets.registry,
                    responseObj
                );

                let validatedEvent;
                try {
                    validatedEvent = await validator.validate(event);
                } catch (ex) {
                    const errorResult = responseObj.error({
                        message: "Validation failed.",
                        error: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data,
                            stack: ex.stack
                        }
                    });

                    const { connectionId, domainName, stage, eventType } =
                        event.requestContext || {};
                    if (connectionId && domainName && stage && eventType === "MESSAGE") {
                        try {
                            const transport = new AwsWebsocketsTransport();
                            const endpoint = `https://${domainName}/${stage}`;
                            await transport.send(
                                [{ connectionId, endpoint }],
                                errorResult
                            );
                        } catch {
                            /* best effort. */
                        }
                    }

                    app.__webiny_raw_result = {
                        statusCode: errorResult.statusCode,
                        headers: {
                            "sec-websocket-protocol": "webiny-ws-v1"
                        }
                    };
                    return reply.send();
                }

                const result = await runner.run(validatedEvent);

                app.__webiny_raw_result = {
                    statusCode: result.statusCode,
                    headers: {
                        "sec-websocket-protocol": "webiny-ws-v1"
                    }
                };

                return reply.send();
            });
        });

        const { tenant, endpoint, token } = getEventValues(event);

        const headers = {
            Authorization: `Bearer ${token}`,
            ["x-tenant"]: tenant,
            ["x-webiny-cms-endpoint"]: endpoint,
            ...event.headers
        };

        return execute({
            app,
            url,
            payload: {
                ...event,
                headers
            }
        });
    };
};
```

- [ ] **Step 2: Create `register.ts`**

```typescript
/* packages/api-websockets-aws/src/handler/register.ts */
import { registry } from "@webiny/handler-aws/registry.js";
import { createSourceHandler } from "@webiny/handler-aws";
import type { HandlerParams, IAwsWebsocketsIncomingEvent } from "./types.js";

const handler = createSourceHandler<IAwsWebsocketsIncomingEvent, HandlerParams>({
    name: "handler-webiny-websockets",
    canUse: event => {
        const { routeKey, connectionId, eventType } = event.requestContext || {};
        return !!routeKey && !!connectionId && !!eventType;
    },
    handle: async ({ params, event, context }) => {
        const { createHandler } = await import(
            /* webpackChunkName: "SocketsHandler" */
            "./handler.js"
        );
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
```

- [ ] **Step 3: Create `src/index.ts`**

```typescript
/* packages/api-websockets-aws/src/index.ts */
import "./handler/register.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { ContextPlugin } from "@webiny/handler";
import { Transport } from "@webiny/api-websockets";
import { AwsWebsocketsTransport } from "~/transport/AwsWebsocketsTransport.js";
import type { Context } from "@webiny/api-websockets";

export const createAwsWebsockets = (): Plugin[] => {
    const plugin = new ContextPlugin<Context>(async context => {
        context.container.registerInstance(Transport, new AwsWebsocketsTransport());
    });
    plugin.name = "websockets.aws.transport";
    return [plugin];
};

export type * from "./handler/types.js";
```

- [ ] **Step 4: Create `src/exports/api.ts`**

```typescript
/* packages/api-websockets-aws/src/exports/api.ts */
export { createAwsWebsockets } from "~/index.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-aws/src/
git commit -m "feat(api-websockets-aws): add handler, register, and barrel exports"
```

### Task 17: Build the AWS package

- [ ] **Step 1: Install deps and build**

```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-websockets-aws 2>&1 | tail -30
```

- [ ] **Step 2: Fix any build errors and commit**

```bash
git add packages/api-websockets-aws/
git commit -m "fix(api-websockets-aws): fix build errors"
```

## Phase 4: Storage Packages Update

### Task 18: Update `api-websockets-ddb`

**Files:**
- Modify: `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`

- [ ] **Step 1: Replace `domainName` + `stage` with `endpoint`**

In `register()` (line 26), change destructuring from `{ connectionId, tenant, identity, domainName, stage, connectedOn }` to `{ connectionId, tenant, identity, endpoint, connectedOn }`.

In the `data` object (lines 28-35), replace `domainName` and `stage` with `endpoint`.

```typescript
/* Only the register method changes: */
public async register(
    params: IWebsocketsConnectionRegistryRegisterParams
): Promise<IWebsocketsConnectionRegistryData> {
    const { connectionId, tenant, identity, endpoint, connectedOn } = params;

    const data: IWebsocketsConnectionRegistryData = {
        connectionId,
        identity,
        tenant,
        endpoint,
        connectedOn
    };
    await this.store(data);
    return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts
git commit -m "refactor(api-websockets-ddb): replace domainName+stage with endpoint"
```

### Task 19: Update `api-websockets-sql`

**Files:**
- Modify: `packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts`

- [ ] **Step 1: Update `ConnectionRow`, `register()`, `toData()`, `ensureTable()`**

Replace `domainName: string` + `stage: string` with `endpoint: string` in the `ConnectionRow` interface (lines 16-17).

In `register()` (lines 45-53), replace `domainName: event.domainName` and `stage: event.stage` with `endpoint: event.endpoint`.

In `toData()` (lines 187-199), replace `domainName: row.domainName` and `stage: row.stage` with `endpoint: row.endpoint`.

In `ensureTable()` (lines 173-184), replace the two `table.text("domainName")` and `table.text("stage")` lines with `table.text("endpoint").notNullable()`.

- [ ] **Step 2: Add migration for existing tables**

Add a `migrateTable()` private method after `ensureTable()`:

```typescript
private async migrateTable(): Promise<void> {
    const hasEndpoint = await this.knex.schema.hasColumn(this.tableName, "endpoint");
    if (hasEndpoint) {
        return;
    }

    await this.knex.schema.alterTable(this.tableName, table => {
        table.text("endpoint").nullable();
    });

    await this.knex(this.tableName).update({
        endpoint: this.knex.raw("'https://' || \"domainName\" || '/' || \"stage\"")
    });

    await this.knex.schema.alterTable(this.tableName, table => {
        table.text("endpoint").notNullable().alter();
        table.dropColumn("domainName");
        table.dropColumn("stage");
    });
}
```

Call `await this.migrateTable()` right after `await this.ensureTable()` in every public method.

- [ ] **Step 3: Commit**

```bash
git add packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts
git commit -m "refactor(api-websockets-sql): replace domainName+stage with endpoint, add migration"
```

## Phase 5: Consumer Templates

### Task 20: Update consumer templates

**Files:**
- Modify: `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`

- [ ] **Step 1: Update the DDB template**

Add `import { createAwsWebsockets } from "@webiny/api-websockets-aws";` to imports. Add `createAwsWebsockets(),` right after `createWebsockets(),` in the plugins array.

- [ ] **Step 2: Update the OpenSearch template**

Same changes.

- [ ] **Step 3: Update the SQLite template**

Same changes.

- [ ] **Step 4: Commit**

```bash
git add packages/project-aws/_templates/
git commit -m "feat(project-aws): add createAwsWebsockets() to consumer templates"
```

## Phase 6: Test Updates

### Task 21: Update base package test mocks and helpers

**Files:**
- Modify: `packages/api-websockets/__tests__/mocks/MockWebsocketsTransport.ts`
- Modify: `packages/api-websockets/__tests__/mocks/MockWebsocketsEventValidator.ts`
- Modify: `packages/api-websockets/__tests__/mocks/event.ts`
- Modify: `packages/api-websockets/__tests__/helpers/graphql/connections.ts`

- [ ] **Step 1: Update `MockWebsocketsTransport.ts`**

Replace `domainName` + `stage` with `endpoint` in connection types. The mock implements `IWebsocketsTransport` — the connection params use `endpoint` now.

- [ ] **Step 2: Update `MockWebsocketsEventValidator.ts`**

Update to return generic `IWebsocketsEvent` with `context` instead of `requestContext`. Change input type to `unknown`.

- [ ] **Step 3: Update `event.ts`**

Create generic mock events using `WebsocketsRoute`/`WebsocketsEventType` string literals. The event shape uses `context` with `connectionId`, `connectedAt`, `host`, `eventType`, `route`, `endpoint`.

- [ ] **Step 4: Update `graphql/connections.ts`**

Replace all `domainName` and `stage` field selections with `endpoint` (5 query/mutation strings).

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets/__tests__/
git commit -m "test(api-websockets): update test mocks for generic event types"
```

### Task 22: Update runner and registry tests

**Files:**
- Modify: `packages/api-websockets/__tests__/runner/websocketsRunner.test.ts`
- Modify: `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts`
- Modify: `packages/api-websockets/__tests__/context/websocketsContext.test.ts`
- Check: `packages/api-websockets/__tests__/types.ts`
- Check: `packages/api-websockets/__tests__/helpers/plugins.ts`
- Check: `packages/api-websockets/__tests__/helpers/useHandler.ts`
- Check: `packages/api-websockets/__tests__/helpers/useGraphQLHandler.ts`

- [ ] **Step 1: Update runner tests**

Remove validator from runner constructor calls. Update event shapes from `requestContext` to `context`. Update expected error messages (e.g., `"$disconnect"` → `"disconnect"`). Remove validation-failure test cases (those belong in the AWS package handler tests).

- [ ] **Step 2: Update registry tests**

Replace `domainName` + `stage` with `endpoint` in all registry data and register call params.

- [ ] **Step 3: Update context tests**

Update to use generic event shape if it constructs events directly.

- [ ] **Step 4: Check and update remaining helpers**

- `__tests__/types.ts`: update if it references `IWebsocketsIncomingEvent` or AWS types.
- `__tests__/helpers/plugins.ts`: update if it creates events with AWS shapes.
- `__tests__/helpers/useHandler.ts`: may need to move to AWS package if it uses `createHandler` from `@webiny/handler-aws`.
- `__tests__/helpers/useGraphQLHandler.ts`: no import changes needed — it uses `@webiny/handler-aws` for test infrastructure (stays as devDep).

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets/__tests__/
git commit -m "test(api-websockets): update all tests for generic event types"
```

### Task 23: Move handler/validator/transport tests to AWS package

**Files:**
- Create: `packages/api-websockets-aws/__tests__/handler/handler.test.ts` (from old handler test)
- Create: `packages/api-websockets-aws/__tests__/handler/register.test.ts`
- Create: `packages/api-websockets-aws/__tests__/transport/AwsWebsocketsTransport.test.ts`
- Create: `packages/api-websockets-aws/__tests__/validator/AwsWebsocketsEventValidator.test.ts`
- Create: `packages/api-websockets-aws/__tests__/mocks/event.ts` (AWS-specific mock events)
- Create: `packages/api-websockets-aws/__tests__/mocks/lambdaContext.ts`
- Delete: `packages/api-websockets/__tests__/handler/` directory
- Delete: `packages/api-websockets/__tests__/transport/`
- Delete: `packages/api-websockets/__tests__/validator/`
- Delete: `packages/api-websockets/__tests__/mocks/lambdaContext.ts`

- [ ] **Step 1: Copy and adapt test files**

Move the test files, updating imports to reference the new AWS package paths. Update class names (`WebsocketsEventValidator` → `AwsWebsocketsEventValidator`, `WebsocketsTransport` → `AwsWebsocketsTransport`).

- [ ] **Step 2: Delete the old test files from base package**

```bash
rm -rf packages/api-websockets/__tests__/handler/
rm -rf packages/api-websockets/__tests__/transport/
rm -rf packages/api-websockets/__tests__/validator/
rm packages/api-websockets/__tests__/mocks/lambdaContext.ts
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-websockets-aws/__tests__/ packages/api-websockets/__tests__/
git commit -m "test(api-websockets-aws): move handler/transport/validator tests to AWS package"
```

## Phase 7: Build, Lint, Test

### Task 24: Run full build and pre-commit checklist

- [ ] **Step 1: Run tsconfig generation**

```bash
node scripts/generateTsConfigsInPackages.js
```

- [ ] **Step 2: Run adio**

```bash
yarn adio
```

- [ ] **Step 3: Run sync-dependencies**

```bash
yarn webiny sync-dependencies
```

- [ ] **Step 4: Install deps**

```bash
yarn > /dev/null 2>&1
```

- [ ] **Step 5: Format**

```bash
yarn format > /dev/null 2>&1
```

- [ ] **Step 6: Lint**

```bash
yarn lint 2>&1 | tail -30
```

- [ ] **Step 7: Build all affected packages**

```bash
yarn build -p @webiny/api-websockets 2>&1 | tail -30
yarn build -p @webiny/api-websockets-aws 2>&1 | tail -30
yarn build -p @webiny/api-websockets-ddb 2>&1 | tail -30
yarn build -p @webiny/api-websockets-sql 2>&1 | tail -30
```

- [ ] **Step 8: Fix any issues and commit**

```bash
git add .
git commit -m "chore: fix build/lint issues after websockets split"
```

### Task 25: Run tests

- [ ] **Step 1: Run base package tests**

```bash
yarn test packages/api-websockets 2>&1 | tail -50
```

- [ ] **Step 2: Run AWS package tests**

```bash
yarn test packages/api-websockets-aws 2>&1 | tail -50
```

- [ ] **Step 3: Run DDB storage tests**

```bash
yarn test packages/api-websockets-ddb 2>&1 | tail -50
```

- [ ] **Step 4: Run SQL storage tests**

```bash
yarn test packages/api-websockets-sql 2>&1 | tail -50
```

- [ ] **Step 5: Fix any failing tests and commit**

```bash
git add .
git commit -m "fix: fix failing tests after websockets split"
```
