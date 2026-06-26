# api-websockets DI Use Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic `WebsocketsContext` class with 4 independent DI-registered use cases, removing `context.websockets` entirely.

**Architecture:** Each use case (ListConnections, SendToIdentity, SendToConnections, Disconnect) gets its own feature folder with `abstractions.ts` + implementation class. A single `WebsocketsFeature` registers all 4 in the DI container. Consumers resolve individual use cases from `context.container`.

**Tech Stack:** TypeScript, `@webiny/di` (Container, Abstraction), `@webiny/feature/api` (createAbstraction, createFeature, Result, BaseError), vitest

## Global Constraints

- One named import per line.
- One class per file.
- `//` for single-line comments, `/* */` for multi-line. Comments end with period.
- Always use `public`/`protected`/`private` + `readonly` on class properties.
- No `export default` — always named exports.
- No one-liners with `await` + `return` — assign to `const`, then return.
- ES modules only (`import`/`export`).
- After each task: run pre-commit checklist (`git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .`), then commit.

---

### Task 1: Move errors + IWebsocketsIdentity, delete old WebsocketService

Housekeeping: relocate shared types before creating new features that depend on them.

**Files:**
- Create: `packages/api-websockets/src/features/shared/errors.ts`
- Modify: `packages/api-websockets/src/types.ts`
- Modify: `packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts`
- Modify: `packages/api-websockets/src/plugins/WebsocketsRoutePlugin.ts`
- Modify: `packages/api-websockets/src/runner/WebsocketsRunner.ts`
- Delete: `packages/api-websockets/src/features/WebsocketService/errors.ts`
- Delete: `packages/api-websockets/src/features/WebsocketService/abstractions.ts`
- Delete: `packages/api-websockets/src/features/WebsocketService/index.ts`

**Interfaces:**
- Produces: `WebsocketsError` union type from `~/features/shared/errors.js`, `IWebsocketsIdentity` from `~/types.js`

- [ ] **Step 1: Create `features/shared/errors.ts`**

Copy the 3 error classes from `features/WebsocketService/errors.ts` and add the `WebsocketsError` union type:

```typescript
import { BaseError } from "@webiny/feature/api";

export class WebsocketServiceError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service" as const;

    constructor(error: Error) {
        super({
            message: "WebsocketService encountered an error.",
            data: { error }
        });
    }
}

export class WebsocketForceDisconnectNotificationError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service/ForceDisconnectNotification" as const;

    constructor(error: Error) {
        super({
            message: "Failed to notify the clients about the forced disconnect.",
            data: { error }
        });
    }
}

export class WebsocketForceDisconnectError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service/ForceDisconnect" as const;

    constructor(error: Error) {
        super({
            message: "Failed to forcefully disconnect the Websocket clients.",
            data: { error }
        });
    }
}

export type WebsocketsError =
    | WebsocketServiceError
    | WebsocketForceDisconnectNotificationError
    | WebsocketForceDisconnectError;
```

- [ ] **Step 2: Move `IWebsocketsIdentity` into `types.ts`**

Add the type alias to `packages/api-websockets/src/types.ts`, replacing the re-export from `context/abstractions`:

```typescript
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;
```

Remove `import type { IWebsocketsContextObject }` and `export type { IWebsocketsContextObject }` from the same file. Remove `websockets: IWebsocketsContextObject` from the `Context` interface.

- [ ] **Step 3: Update `IWebsocketsConnectionRegistry` import**

In `packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts`, change line 1:

```typescript
/* Before */
import type { IWebsocketsIdentity } from "~/context/abstractions/IWebsocketsContext.js";

/* After */
import type { IWebsocketsIdentity } from "~/types.js";
```

- [ ] **Step 4: Update `WebsocketsRoutePlugin` import**

In `packages/api-websockets/src/plugins/WebsocketsRoutePlugin.ts`, change line 7:

```typescript
/* Before */
import type { IWebsocketsIdentity } from "~/context/index.js";

/* After */
import type { IWebsocketsIdentity } from "~/types.js";
```

- [ ] **Step 5: Update `WebsocketsRunner` import**

In `packages/api-websockets/src/runner/WebsocketsRunner.ts`, change line 23:

```typescript
/* Before */
import type { IWebsocketsIdentity } from "~/context/index.js";

/* After */
import type { IWebsocketsIdentity } from "~/types.js";
```

- [ ] **Step 6: Delete old WebsocketService directory**

Delete the entire `packages/api-websockets/src/features/WebsocketService/` directory (3 files: `errors.ts`, `abstractions.ts`, `index.ts`).

- [ ] **Step 7: Type check**

Run: `yarn check -p @webiny/api-websockets 2>&1 | tail -30`

Expected: Type errors related to `context.websockets` usages and the deleted `WebsocketService` import in `WebsocketsContext.ts` — these are expected since we haven't migrated those files yet. No errors in the files we just modified.

- [ ] **Step 8: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "refactor(api-websockets): move errors and IWebsocketsIdentity, delete WebsocketService"
```

---

### Task 2: Create ListConnections use case

The foundation use case — all other use cases depend on it.

**Files:**
- Create: `packages/api-websockets/src/features/ListConnections/abstractions.ts`
- Create: `packages/api-websockets/src/features/ListConnections/ListConnectionsUseCase.ts`

**Interfaces:**
- Consumes: `ConnectionRegistry` abstraction from `~/features/ConnectionRegistry/abstractions.js`, `IWebsocketsConnectionRegistryData` from `~/registry/index.js`, `WebsocketsError` from `~/features/shared/errors.js`
- Produces: `WebsocketsListConnectionsUseCase` DI token, `IListConnectionsUseCase` interface, `IWebsocketsListConnectionsParams`, `IWebsocketsListConnectionsParamsWhere`

- [ ] **Step 1: Create `ListConnections/abstractions.ts`**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export interface IWebsocketsListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    connections?: string[];
}

export interface IWebsocketsListConnectionsParams {
    where?: IWebsocketsListConnectionsParamsWhere;
}

export interface IListConnectionsUseCase {
    execute(
        params?: IWebsocketsListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}

export const WebsocketsListConnectionsUseCase =
    createAbstraction<IListConnectionsUseCase>("Websockets/ListConnections");

export namespace WebsocketsListConnectionsUseCase {
    export type Interface = IListConnectionsUseCase;
    export type Params = IWebsocketsListConnectionsParams;
    export type ParamsWhere = IWebsocketsListConnectionsParamsWhere;
}
```

- [ ] **Step 2: Create `ListConnections/ListConnectionsUseCase.ts`**

Port the `listConnections` method from `WebsocketsContext.ts` (lines 70–96):

```typescript
import { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type {
    IListConnectionsUseCase,
    IWebsocketsListConnectionsParams
} from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

export class ListConnectionsUseCase implements IListConnectionsUseCase {
    private readonly registry: IWebsocketsConnectionRegistry;

    constructor(registry: IWebsocketsConnectionRegistry) {
        this.registry = registry;
    }

    public async execute(
        params?: IWebsocketsListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>> {
        let connections: IWebsocketsConnectionRegistryData[] = [];

        try {
            const where = params?.where || {};
            if (where.identityId) {
                connections = await this.registry.listViaIdentity(where.identityId);
            } else if (where.connections) {
                connections = await this.registry.listViaConnections(where.connections);
            } else if (where.tenant) {
                connections = await this.registry.listViaTenant(where.tenant);
            } else {
                connections = await this.registry.listAll();
            }
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        connections = connections.filter(c => c.connectedOn >= threeHoursAgo);

        return Result.ok(connections);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "feat(api-websockets): add ListConnections use case"
```

---

### Task 3: Create SendToConnections use case

Standalone — depends only on `WebsocketsTransport`.

**Files:**
- Create: `packages/api-websockets/src/features/SendToConnections/abstractions.ts`
- Create: `packages/api-websockets/src/features/SendToConnections/SendToConnectionsUseCase.ts`

**Interfaces:**
- Consumes: `WebsocketsTransport` from `~/transport/index.js`, `WebsocketsError` from `~/features/shared/errors.js`
- Produces: `WebsocketsSendToConnectionsUseCase` DI token, `ISendToConnectionsUseCase` interface

- [ ] **Step 1: Create `SendToConnections/abstractions.ts`**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsTransportSendConnection } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export interface ISendToConnectionsUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}

export const WebsocketsSendToConnectionsUseCase =
    createAbstraction<ISendToConnectionsUseCase>("Websockets/SendToConnections");

export namespace WebsocketsSendToConnectionsUseCase {
    export type Interface = ISendToConnectionsUseCase;
}
```

- [ ] **Step 2: Create `SendToConnections/SendToConnectionsUseCase.ts`**

Port from `WebsocketsContext.ts` (lines 57–68):

```typescript
import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IWebsocketsTransportSendConnection } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { ISendToConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

export class SendToConnectionsUseCase implements ISendToConnectionsUseCase {
    private readonly transport: IWebsocketsTransport;

    constructor(transport: IWebsocketsTransport) {
        this.transport = transport;
    }

    public async execute<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>> {
        try {
            await this.transport.send<T>(connections, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        return Result.ok();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "feat(api-websockets): add SendToConnections use case"
```

---

### Task 4: Create SendToIdentity use case

Depends on `ListConnectionsUseCase` and `WebsocketsTransport`.

**Files:**
- Create: `packages/api-websockets/src/features/SendToIdentity/abstractions.ts`
- Create: `packages/api-websockets/src/features/SendToIdentity/SendToIdentityUseCase.ts`

**Interfaces:**
- Consumes: `IListConnectionsUseCase` from `~/features/ListConnections/abstractions.js`, `IWebsocketsTransport` from `~/transport/index.js`, `IWebsocketsIdentity` from `~/types.js`
- Produces: `WebsocketsSendToIdentityUseCase` DI token, `ISendToIdentityUseCase` interface

- [ ] **Step 1: Create `SendToIdentity/abstractions.ts`**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsIdentity } from "~/types.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export interface ISendToIdentityUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}

export const WebsocketsSendToIdentityUseCase =
    createAbstraction<ISendToIdentityUseCase>("Websockets/SendToIdentity");

export namespace WebsocketsSendToIdentityUseCase {
    export type Interface = ISendToIdentityUseCase;
}
```

- [ ] **Step 2: Create `SendToIdentity/SendToIdentityUseCase.ts`**

Port from `WebsocketsContext.ts` (lines 34–55):

```typescript
import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsIdentity } from "~/types.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { IListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import type { ISendToIdentityUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

export class SendToIdentityUseCase implements ISendToIdentityUseCase {
    private readonly listConnections: IListConnectionsUseCase;
    private readonly transport: IWebsocketsTransport;

    constructor(listConnections: IListConnectionsUseCase, transport: IWebsocketsTransport) {
        this.listConnections = listConnections;
        this.transport = transport;
    }

    public async execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>> {
        const result = await this.listConnections.execute({
            where: {
                identityId: identity.id
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        try {
            await this.transport.send<T>(result.value, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        return Result.ok();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "feat(api-websockets): add SendToIdentity use case"
```

---

### Task 5: Create Disconnect use case

Depends on `ListConnectionsUseCase`, `ConnectionRegistry`, and `WebsocketsTransport`.

**Files:**
- Create: `packages/api-websockets/src/features/Disconnect/abstractions.ts`
- Create: `packages/api-websockets/src/features/Disconnect/DisconnectUseCase.ts`

**Interfaces:**
- Consumes: `IListConnectionsUseCase` from `~/features/ListConnections/abstractions.js`, `IWebsocketsConnectionRegistry` from `~/registry/index.js`, `IWebsocketsTransport` from `~/transport/index.js`
- Produces: `WebsocketsDisconnectUseCase` DI token, `IDisconnectUseCase` interface, `IWebsocketsDisconnectParams` type alias

- [ ] **Step 1: Create `Disconnect/abstractions.ts`**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IWebsocketsListConnectionsParams } from "~/features/ListConnections/abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export type IWebsocketsDisconnectParams = IWebsocketsListConnectionsParams;

export interface IDisconnectUseCase {
    execute(
        params?: IWebsocketsDisconnectParams,
        notify?: boolean
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}

export const WebsocketsDisconnectUseCase =
    createAbstraction<IDisconnectUseCase>("Websockets/Disconnect");

export namespace WebsocketsDisconnectUseCase {
    export type Interface = IDisconnectUseCase;
    export type Params = IWebsocketsDisconnectParams;
}
```

- [ ] **Step 2: Create `Disconnect/DisconnectUseCase.ts`**

Port from `WebsocketsContext.ts` (lines 98–134). Preserve intentional swallowing of `unregister()` errors:

```typescript
import { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import type {
    IDisconnectUseCase,
    IWebsocketsDisconnectParams
} from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import {
    WebsocketForceDisconnectError,
    WebsocketForceDisconnectNotificationError
} from "~/features/shared/errors.js";

export class DisconnectUseCase implements IDisconnectUseCase {
    private readonly listConnections: IListConnectionsUseCase;
    private readonly registry: IWebsocketsConnectionRegistry;
    private readonly transport: IWebsocketsTransport;

    constructor(
        listConnections: IListConnectionsUseCase,
        registry: IWebsocketsConnectionRegistry,
        transport: IWebsocketsTransport
    ) {
        this.listConnections = listConnections;
        this.registry = registry;
        this.transport = transport;
    }

    public async execute(
        params?: IWebsocketsDisconnectParams,
        notify = true
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>> {
        const result = await this.listConnections.execute(params);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const connections = result.value;

        for (const connection of connections) {
            try {
                await this.registry.unregister(connection);
            } catch {
                // Intentional: failed unregister for one connection must not prevent disconnecting others.
            }
        }

        if (notify) {
            try {
                await this.transport.send(connections, {
                    action: "forcedDisconnect"
                });
            } catch (error) {
                return Result.fail(new WebsocketForceDisconnectNotificationError(error));
            }
        }

        try {
            await this.transport.disconnect(connections);
        } catch (error) {
            return Result.fail(new WebsocketForceDisconnectError(error));
        }

        return Result.ok(connections);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "feat(api-websockets): add Disconnect use case"
```

---

### Task 6: Create WebsocketsFeature, update exports, delete old context

Wire all 4 use cases into DI, update `index.ts` and `exports/api.ts`, delete the monolithic context.

**Files:**
- Create: `packages/api-websockets/src/features/feature.ts`
- Modify: `packages/api-websockets/src/exports/api.ts`
- Modify: `packages/api-websockets/src/index.ts`
- Delete: `packages/api-websockets/src/context/WebsocketsContext.ts`
- Delete: `packages/api-websockets/src/context/abstractions/IWebsocketsContext.ts`
- Delete: `packages/api-websockets/src/context/index.ts`

**Interfaces:**
- Consumes: All 4 use case abstractions, `ConnectionRegistry`, `WebsocketsTransport`
- Produces: `WebsocketsFeature` (the `createFeature` definition)

- [ ] **Step 1: Create `features/feature.ts`**

```typescript
import { createFeature } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { ListConnectionsUseCase } from "~/features/ListConnections/ListConnectionsUseCase.js";
import { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
import { SendToConnectionsUseCase } from "~/features/SendToConnections/SendToConnectionsUseCase.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/SendToIdentity/abstractions.js";
import { SendToIdentityUseCase } from "~/features/SendToIdentity/SendToIdentityUseCase.js";
import { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
import { DisconnectUseCase } from "~/features/Disconnect/DisconnectUseCase.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsTransport } from "~/transport/index.js";

export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container) {
        container.register(WebsocketsListConnectionsUseCase, {
            implementation: ListConnectionsUseCase,
            dependencies: [ConnectionRegistry]
        });

        container.register(WebsocketsSendToConnectionsUseCase, {
            implementation: SendToConnectionsUseCase,
            dependencies: [WebsocketsTransport]
        });

        container.register(WebsocketsSendToIdentityUseCase, {
            implementation: SendToIdentityUseCase,
            dependencies: [WebsocketsListConnectionsUseCase, WebsocketsTransport]
        });

        container.register(WebsocketsDisconnectUseCase, {
            implementation: DisconnectUseCase,
            dependencies: [
                WebsocketsListConnectionsUseCase,
                ConnectionRegistry,
                WebsocketsTransport
            ]
        });
    }
});
```

- [ ] **Step 2: Update `exports/api.ts`**

Replace entire file content:

```typescript
export { WebsocketsTransport } from "~/transport/index.js";
export { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
export { WebsocketsSendToIdentityUseCase } from "~/features/SendToIdentity/abstractions.js";
export { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
export { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
export type { WebsocketsError } from "~/features/shared/errors.js";
```

- [ ] **Step 3: Update `index.ts`**

Replace `createWebsocketsContext` with `WebsocketsFeature` export. Remove `export * from "./context/index.js"`:

```typescript
import type { Plugin } from "@webiny/plugins/types.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const createWebsockets = (): Plugin[] => {
    return [createWebsocketsGraphQL()];
};

export { WebsocketsFeature } from "./features/feature.js";

export type * from "./validator/index.js";
export { WebsocketsTransport } from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";

export * from "./plugins/index.js";
export type * from "./types.js";
```

- [ ] **Step 4: Delete old context directory**

Delete the entire `packages/api-websockets/src/context/` directory.

- [ ] **Step 5: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "feat(api-websockets): add WebsocketsFeature, update exports, delete old context"
```

---

### Task 7: Migrate WebsocketsRunner and GraphQL resolvers

Update the two internal consumers of `context.websockets`.

**Files:**
- Modify: `packages/api-websockets/src/runner/WebsocketsRunner.ts`
- Modify: `packages/api-websockets/src/graphql/createResolvers.ts`

**Interfaces:**
- Consumes: `WebsocketsSendToConnectionsUseCase`, `WebsocketsListConnectionsUseCase`, `WebsocketsDisconnectUseCase`, `ConnectionRegistry`

- [ ] **Step 1: Migrate WebsocketsRunner**

Rewrite `packages/api-websockets/src/runner/WebsocketsRunner.ts`:

- Remove `registry` constructor param — resolve from container.
- Add `sendToConnections` field — resolve from container.
- Update `respond()` to use `this.sendToConnections.execute()`.
- Update `MiddlewareParams` to remove the external `registry` dependency.
- Update imports.

```typescript
import WebinyError from "@webiny/error";
import type {
    IWebsocketsEvent,
    IWebsocketsEventContext,
    IWebsocketsEventData,
    WebsocketsRoute
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
import type { IWebsocketsIdentity } from "~/types.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
import type { ISendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";

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
    private readonly sendToConnections: ISendToConnectionsUseCase;

    public constructor(context: Context, response: IWebsocketsResponse) {
        this.context = context;
        this.registry = context.container.resolve(ConnectionRegistry);
        this.response = response;
        this.sendToConnections = context.container.resolve(WebsocketsSendToConnectionsUseCase);
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
        await this.sendToConnections.execute([connection], dataToSend);
    }
}
```

- [ ] **Step 2: Migrate GraphQL resolvers**

Rewrite `packages/api-websockets/src/graphql/createResolvers.ts`:

```typescript
import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { Context } from "~/types.js";
import { emptyResolver, resolve } from "./utils.js";
import type { IWebsocketsListConnectionsParams } from "~/features/ListConnections/abstractions.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import { checkPermissions } from "~/graphql/checkPermissions.js";

export interface IWebsocketsMutationDisconnectConnectionsArgs {
    connections: string[];
}

export interface IWebsocketsMutationDisconnectIdentityArgs {
    identityId: string;
}

export interface IWebsocketsMutationDisconnectTenantArgs {
    tenant: string;
}

export const createResolvers = (): Resolvers<Context> => {
    return {
        Query: {
            websockets: emptyResolver
        },
        Mutation: {
            websockets: emptyResolver
        },
        WebsocketsQuery: {
            listConnections: async (_, args: IWebsocketsListConnectionsParams, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    const listConnections = context.container.resolve(
                        WebsocketsListConnectionsUseCase
                    );
                    const result = await listConnections.execute(args);

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            }
        },
        WebsocketsMutation: {
            disconnect: async (_, args: IWebsocketsMutationDisconnectConnectionsArgs, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            connections: args.connections
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectIdentity: async (
                _,
                args: IWebsocketsMutationDisconnectIdentityArgs,
                context
            ) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            identityId: args.identityId
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectTenant: async (_, args: IWebsocketsMutationDisconnectTenantArgs, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            tenant: args.tenant
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectAll: async (_, __, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute();

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            }
        }
    };
};
```

- [ ] **Step 3: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "refactor(api-websockets): migrate runner and resolvers to DI use cases"
```

---

### Task 8: Migrate tests and test helper

Update test setup and all test files in `api-websockets`.

**Files:**
- Modify: `packages/api-websockets/__tests__/helpers/plugins.ts`
- Modify: `packages/api-websockets/__tests__/runner/websocketsRunner.test.ts`
- Modify: `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts`

**Interfaces:**
- Consumes: `WebsocketsFeature`, `ConnectionRegistry`, `WebsocketsListConnectionsUseCase`

- [ ] **Step 1: Update test helper `plugins.ts`**

In `packages/api-websockets/__tests__/helpers/plugins.ts`:

Replace `import { createWebsockets } from "~/index"` with:
```typescript
import { createWebsockets } from "~/index";
import { WebsocketsFeature } from "~/features/feature.js";
```

In the `container.register([...])` call, add `WebsocketsFeature` registration via a `createRegisterExtensionPlugin`:

The existing `createRegisterExtensionPlugin` that registers `MockWebsocketsTransport` should also register `WebsocketsFeature`:

```typescript
createRegisterExtensionPlugin(context => {
    context.container.registerInstance(WebsocketsTransport, new MockWebsocketsTransport());
    WebsocketsFeature.register(context.container);
}),
```

- [ ] **Step 2: Update `websocketsRunner.test.ts`**

Replace all occurrences of:
- `import { WebsocketsContext } from "~/context/WebsocketsContext.js"` — remove
- `context.websockets.registry` — replace with `context.container.resolve(ConnectionRegistry)`
- `context.websockets = new WebsocketsContext(registry, new MockWebsocketsTransport())` — remove (DI handles this now)
- `new WebsocketsRunner(context, registry, response)` — replace with `new WebsocketsRunner(context, response)`

Add import:
```typescript
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
```

For each test, the pattern becomes:
```typescript
const context = await handler.handle();
const response = new WebsocketsResponse();
const runner = new WebsocketsRunner(context, response);
```

- [ ] **Step 3: Update `websocketsConnectionRegistry.test.ts`**

Replace `context.websockets.registry` with:
```typescript
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
// ...
const registry = context.container.resolve(ConnectionRegistry);
```

- [ ] **Step 4: Run tests**

Run: `yarn test packages/api-websockets 2>&1 | tail -50`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "test(api-websockets): migrate tests to DI use cases"
```

---

### Task 9: Migrate api-websockets-aws handler and tests

Update the AWS handler and its test file.

**Files:**
- Modify: `packages/api-websockets-aws/src/handler/handler.ts`
- Modify: `packages/api-websockets-aws/__tests__/handler/handler.test.ts`

**Interfaces:**
- Consumes: `ConnectionRegistry`, `WebsocketsListConnectionsUseCase`, `WebsocketsRunner` (new 2-arg constructor)

- [ ] **Step 1: Update `handler.ts`**

In `packages/api-websockets-aws/src/handler/handler.ts`, find the line that creates the runner (around line 62):

```typescript
/* Before */
const runner = new WebsocketsRunner(
    context,
    context.websockets.registry,
    responseObj
);

/* After */
const runner = new WebsocketsRunner(
    context,
    responseObj
);
```

Remove any import of `context.websockets` types if present. Add import if needed:
```typescript
import { ConnectionRegistry } from "@webiny/api-websockets/features/ConnectionRegistry/abstractions.js";
```

Also update any direct `context.websockets.registry` access to `context.container.resolve(ConnectionRegistry)`.

- [ ] **Step 2: Update `handler.test.ts`**

Replace all `context.websockets.listConnections(...)` calls with:

```typescript
import { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/features/ListConnections/abstractions.js";
// ...
const listConnections = context.container.resolve(WebsocketsListConnectionsUseCase);
const result = await listConnections.execute(...);
```

There are 6+ call sites — update all of them.

- [ ] **Step 3: Run tests**

Run: `yarn test packages/api-websockets-aws 2>&1 | tail -50`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "refactor(api-websockets-aws): migrate handler and tests to DI use cases"
```

---

### Task 10: Migrate external consumers and webiny re-export

Update `api-record-locking`, `ai-powerups`, `api-file-manager-s3`, and `packages/webiny`.

**Files:**
- Modify: `packages/api-record-locking/src/features/KickOutCurrentUser/KickOutCurrentUserUseCase.ts`
- Modify: `packages/ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts`
- Modify: `packages/ai-powerups/src/api/features/WbGeneratePageContent/WbGeneratePageContentTask.ts`
- Modify: `packages/api-file-manager-s3/src/assetDelivery/threatDetection/processThreatScanResult.ts`
- Modify: `packages/webiny/src/api.ts`

**Interfaces:**
- Consumes: `WebsocketsSendToIdentityUseCase`, `WebsocketsSendToConnectionsUseCase`, `WebsocketsListConnectionsUseCase`

- [ ] **Step 1: Migrate KickOutCurrentUserUseCase**

In `packages/api-record-locking/src/features/KickOutCurrentUser/KickOutCurrentUserUseCase.ts`:

```typescript
/* Before */
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
// constructor: private websocketService?: WebsocketService.Interface
// dependencies: [IdentityContext, [WebsocketService, { optional: true }]]

/* After */
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
// constructor: private sendToIdentity?: WebsocketsSendToIdentityUseCase.Interface
// dependencies: [IdentityContext, [WebsocketsSendToIdentityUseCase, { optional: true }]]
```

Update the `execute` method:
```typescript
/* Before */
await this.websocketService.send({ id: lockedBy.id }, { ... });

/* After */
await this.sendToIdentity.execute({ id: lockedBy.id }, { ... });
```

And the null guard:
```typescript
if (!this.sendToIdentity) {
    return Result.ok();
}
```

- [ ] **Step 2: Migrate AiImageEnrichmentTask**

In `packages/ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts`:

Replace the single `WebsocketService` optional dependency with two optional dependencies. Since the class has 7 constructor params and we're replacing the 7th (optional) with two, the dependency array expands:

```typescript
/* Before */
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
// constructor: private websocketService?: WebsocketService.Interface
// dependencies: [..., [WebsocketService, { optional: true }]]

/* After */
import { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/features/ListConnections/abstractions.js";
import { WebsocketsSendToConnectionsUseCase } from "@webiny/api-websockets/features/SendToConnections/abstractions.js";
// constructor:
//   private listConnections?: WebsocketsListConnectionsUseCase.Interface,
//   private sendToConnections?: WebsocketsSendToConnectionsUseCase.Interface
// dependencies: [..., [WebsocketsListConnectionsUseCase, { optional: true }], [WebsocketsSendToConnectionsUseCase, { optional: true }]]
```

Update all method calls inside the class from `this.websocketService.listConnections(...)` to `this.listConnections?.execute(...)` and `this.websocketService.sendToConnections(...)` to `this.sendToConnections?.execute(...)`.

- [ ] **Step 3: Migrate WbGeneratePageContentTask**

In `packages/ai-powerups/src/api/features/WbGeneratePageContent/WbGeneratePageContentTask.ts`:

```typescript
/* Before */
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
// constructor: private websocketService: WebsocketService.Interface
// dependencies: [IdentityContext, WbGeneratePageContentUseCase, WebsocketService]

/* After */
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
// constructor: private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
// dependencies: [IdentityContext, WbGeneratePageContentUseCase, WebsocketsSendToIdentityUseCase]
```

Update calls: `this.websocketService.send(...)` → `this.sendToIdentity.execute(...)`.

- [ ] **Step 4: Migrate processThreatScanResult**

In `packages/api-file-manager-s3/src/assetDelivery/threatDetection/processThreatScanResult.ts`:

```typescript
/* Before */
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
const websocketService = context.container.resolve(WebsocketService);
let allConnections: WebsocketService.Connection[] = [];
const connectionsResult = await websocketService.listConnections();
await websocketService.sendToConnections(allConnections, { ... });

/* After */
import { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/features/ListConnections/abstractions.js";
import { WebsocketsSendToConnectionsUseCase } from "@webiny/api-websockets/features/SendToConnections/abstractions.js";
import type { IWebsocketsConnectionRegistryData } from "@webiny/api-websockets/registry/index.js";

const listConnections = context.container.resolve(WebsocketsListConnectionsUseCase);
const sendToConnections = context.container.resolve(WebsocketsSendToConnectionsUseCase);
let allConnections: IWebsocketsConnectionRegistryData[] = [];
const connectionsResult = await listConnections.execute();
await sendToConnections.execute(allConnections, { ... });
```

- [ ] **Step 5: Update `packages/webiny/src/api.ts`**

Replace line 16:

```typescript
/* Before */
export { WebsocketService as Websockets } from "@webiny/api-websockets/features/WebsocketService/index.js";

/* After */
export { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/features/ListConnections/abstractions.js";
export { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
export { WebsocketsSendToConnectionsUseCase } from "@webiny/api-websockets/features/SendToConnections/abstractions.js";
export { WebsocketsDisconnectUseCase } from "@webiny/api-websockets/features/Disconnect/abstractions.js";
```

- [ ] **Step 6: Build all affected packages**

Run: `yarn build -p @webiny/api-websockets --safe-replace 2>&1 | tail -30`
Run: `yarn build -p @webiny/api-websockets-aws --safe-replace 2>&1 | tail -30`
Run: `yarn build -p @webiny/api-record-locking --safe-replace 2>&1 | tail -30`
Run: `yarn build -p @webiny/ai-powerups --safe-replace 2>&1 | tail -30`
Run: `yarn build -p @webiny/api-file-manager-s3 --safe-replace 2>&1 | tail -30`
Run: `yarn build -p webiny --safe-replace 2>&1 | tail -30`

Expected: All build clean.

- [ ] **Step 7: Commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "refactor: migrate external consumers to websockets DI use cases"
```

---

### Task 11: Final verification

Run all affected test suites and build to confirm nothing is broken.

**Files:** None (verification only)

- [ ] **Step 1: Run api-websockets tests**

Run: `yarn test packages/api-websockets 2>&1 | tail -50`

Expected: All tests pass.

- [ ] **Step 2: Run api-websockets-aws tests**

Run: `yarn test packages/api-websockets-aws 2>&1 | tail -50`

Expected: All tests pass.

- [ ] **Step 3: Type check all affected packages**

Run: `yarn check -p @webiny/api-websockets 2>&1 | tail -30`
Run: `yarn check -p @webiny/api-websockets-aws 2>&1 | tail -30`
Run: `yarn check -p @webiny/api-record-locking 2>&1 | tail -30`
Run: `yarn check -p @webiny/ai-powerups 2>&1 | tail -30`
Run: `yarn check -p @webiny/api-file-manager-s3 2>&1 | tail -30`

Expected: All type checks pass.

- [ ] **Step 4: Update ai-context docs**

Update `ai-context/core-features-reference.md` to document the new use case abstractions, replacing the old `WebsocketService` entry.

- [ ] **Step 5: Final commit**

```bash
git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .
git commit -m "docs: update core-features-reference for websockets DI use cases"
```
