# api-websockets-server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@webiny/api-websockets-server` — a Docker/self-hosted WebSocket server transport that implements the platform-agnostic `@webiny/api-websockets` base package abstractions.

**Architecture:** Three DI abstractions (adapter, upgrade handler, connection manager) + a transport implementation + an event validator + a server lifecycle orchestrator. Mirrors the `@webiny/api-websockets-aws` package structure. Uses Node built-in `ws` as default WebSocket library. Single shared Webiny context created at startup.

**Tech Stack:** TypeScript, Node.js `ws`, Vitest, `@webiny/feature` DI, `@webiny/handler` Fastify base

**Spec:** `ai-context/specs/api-websockets-server.md`

---

## Task 0: Registry interface changes (base + storage packages)

Before the new package can be built, the base registry interface and both storage implementations need two new methods: `updateLastSeen` and `listStale`.

**Files:**
- Modify: `packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts`
- Modify: `packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts`
- Modify: `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`
- Test: `packages/api-websockets-sql/__tests__/WebsocketsConnectionRegistry.test.ts` (create if not exists)
- Test: `packages/api-websockets-ddb/__tests__/WebsocketsConnectionRegistry.test.ts` (create if not exists)

- [ ] **Step 1: Add `updateLastSeen` and `listStale` to the registry interface**

Add to `packages/api-websockets/src/registry/abstractions/IWebsocketsConnectionRegistry.ts`:

```typescript
export interface IWebsocketsConnectionRegistry {
    register(
        event: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData>;
    unregister(event: IWebsocketsConnectionRegistryUnregisterParams): Promise<void>;

    listViaConnections(connections: string[]): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]>;
    listAll(): Promise<IWebsocketsConnectionRegistryData[]>;

    updateLastSeen(connectionId: string): Promise<void>;
    listStale(olderThan: Date): Promise<IWebsocketsConnectionRegistryData[]>;
}
```

- [ ] **Step 2: Add `lastSeen` column migration and implement methods in SQL registry**

In `packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts`:

1. Add `lastSeen` to `ConnectionRow`:
```typescript
interface ConnectionRow {
    connectionId: string;
    identityId: string;
    identityDisplayName: string;
    identityType: string;
    tenant: string;
    endpoint: string;
    connectedOn: string;
    lastSeen: string | null;
}
```

2. Add a new migration method `migrateLastSeen` (following the existing `migrateTable` pattern):
```typescript
private async migrateLastSeen(): Promise<void> {
    const hasLastSeen = await this.knex.schema.hasColumn(this.tableName, "lastSeen");
    if (hasLastSeen) {
        return;
    }

    await this.knex.schema.alterTable(this.tableName, table => {
        table.datetime("lastSeen").nullable();
    });
}
```

3. Call `this.migrateLastSeen()` after `this.migrateTable()` in every public method.

4. Implement `updateLastSeen`:
```typescript
public async updateLastSeen(connectionId: string): Promise<void> {
    try {
        await this.ensureTable();
        await this.migrateTable();
        await this.migrateLastSeen();

        await this.knex<ConnectionRow>(this.tableName)
            .where("connectionId", connectionId)
            .update({ lastSeen: new Date().toISOString() });
    } catch (err) {
        throw WebinyError.from(err, {
            message: "Could not update lastSeen for websockets connection.",
            code: "UPDATE_LAST_SEEN_ERROR",
            data: { connectionId }
        });
    }
}
```

5. Implement `listStale`:
```typescript
public async listStale(olderThan: Date): Promise<IWebsocketsConnectionRegistryData[]> {
    try {
        await this.ensureTable();
        await this.migrateTable();
        await this.migrateLastSeen();

        const rows = await this.knex<ConnectionRow>(this.tableName)
            .where("lastSeen", "<", olderThan.toISOString())
            .orWhereNull("lastSeen");

        return rows.map(row => this.toData(row));
    } catch (err) {
        throw WebinyError.from(err, {
            message: "Could not list stale websockets connections.",
            code: "LIST_STALE_CONNECTIONS_ERROR",
            data: { olderThan: olderThan.toISOString() }
        });
    }
}
```

- [ ] **Step 3: Add no-op implementations in DDB registry**

In `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`:

```typescript
public async updateLastSeen(_connectionId: string): Promise<void> {
    /* No-op: heartbeat/TTL cleanup is only used with SQL storage. */
}

public async listStale(_olderThan: Date): Promise<IWebsocketsConnectionRegistryData[]> {
    /* No-op: heartbeat/TTL cleanup is only used with SQL storage. */
    return [];
}
```

- [ ] **Step 4: Write tests for the new SQL registry methods**

Create or extend `packages/api-websockets-sql/__tests__/WebsocketsConnectionRegistry.test.ts`. Use an in-memory SQLite via Knex for fast tests:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import knex from "knex";
import { WebsocketsConnectionRegistry } from "~/WebsocketsConnectionRegistry.js";

const createKnex = () => {
    return knex({
        client: "better-sqlite3",
        connection: { filename: ":memory:" },
        useNullAsDefault: true
    });
};

const identity = { id: "id-1", displayName: "Test User", type: "admin" };

describe("WebsocketsConnectionRegistry - updateLastSeen / listStale", () => {
    let db: ReturnType<typeof createKnex>;
    let registry: WebsocketsConnectionRegistry;

    beforeEach(async () => {
        db = createKnex();
        registry = new WebsocketsConnectionRegistry({ knex: db });
    });

    it("should update lastSeen for a connection", async () => {
        await registry.register({
            connectionId: "conn-1",
            tenant: "root",
            identity,
            endpoint: "ws://localhost:8080",
            connectedOn: new Date().toISOString()
        });

        await registry.updateLastSeen("conn-1");

        const all = await registry.listAll();
        expect(all).toHaveLength(1);
    });

    it("should return stale connections", async () => {
        const oldDate = new Date(Date.now() - 600000).toISOString();

        await registry.register({
            connectionId: "conn-old",
            tenant: "root",
            identity,
            endpoint: "ws://localhost:8080",
            connectedOn: oldDate
        });

        /* listStale should return conn-old since lastSeen is null. */
        const stale = await registry.listStale(new Date(Date.now() - 300000));
        expect(stale).toHaveLength(1);
        expect(stale[0].connectionId).toBe("conn-old");
    });

    it("should not return recently seen connections as stale", async () => {
        await registry.register({
            connectionId: "conn-fresh",
            tenant: "root",
            identity,
            endpoint: "ws://localhost:8080",
            connectedOn: new Date().toISOString()
        });

        await registry.updateLastSeen("conn-fresh");

        const stale = await registry.listStale(new Date(Date.now() - 300000));
        expect(stale).toHaveLength(0);
    });
});
```

- [ ] **Step 5: Run tests and verify**

Run: `yarn test packages/api-websockets-sql 2>&1 | tail -30`
Expected: All tests pass.

Run: `yarn test packages/api-websockets-ddb 2>&1 | tail -30`
Expected: All tests pass (existing tests still green).

- [ ] **Step 6: Build affected packages**

Run: `yarn build -p @webiny/api-websockets -p @webiny/api-websockets-sql -p @webiny/api-websockets-ddb 2>&1 | tail -30`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/api-websockets/src/registry packages/api-websockets-sql packages/api-websockets-ddb
git commit -m "feat(api-websockets): add updateLastSeen and listStale to connection registry"
```

---

## Task 1: Scaffold the new package

**Files:**
- Create: `packages/api-websockets-server/package.json`
- Create: `packages/api-websockets-server/tsconfig.json`
- Create: `packages/api-websockets-server/tsconfig.build.json`
- Create: `packages/api-websockets-server/webiny.config.js`
- Create: `packages/api-websockets-server/vitest.config.ts`
- Create: `packages/api-websockets-server/src/index.ts` (empty placeholder)
- Create: `packages/api-websockets-server/src/exports/api.ts` (empty placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-websockets-server",
  "version": "0.0.0",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git"
  },
  "description": "Self-hosted WebSocket server transport for @webiny/api-websockets",
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
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0",
    "ws": "^8.18.0"
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
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../handler" },
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
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/handler/*": ["../handler/src/*"],
      "@webiny/handler": ["../handler/src"],
      "@webiny/plugins/*": ["../plugins/src/*"],
      "@webiny/plugins": ["../plugins/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create `tsconfig.build.json`**

```json
{
  "extends": "../../tsconfig.build.json",
  "include": ["src"],
  "references": [
    { "path": "../api/tsconfig.build.json" },
    { "path": "../api-websockets/tsconfig.build.json" },
    { "path": "../error/tsconfig.build.json" },
    { "path": "../feature/tsconfig.build.json" },
    { "path": "../handler/tsconfig.build.json" },
    { "path": "../plugins/tsconfig.build.json" },
    { "path": "../utils/tsconfig.build.json" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-websockets/*": ["../api-websockets/src/*"],
      "@webiny/api-websockets": ["../api-websockets/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/handler/*": ["../handler/src/*"],
      "@webiny/handler": ["../handler/src"],
      "@webiny/plugins/*": ["../plugins/src/*"],
      "@webiny/plugins": ["../plugins/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
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

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        include: ["__tests__/**/*.test.ts"]
    },
    resolve: {
        alias: {
            "~": resolve(import.meta.dirname, "src"),
            "~tests": resolve(import.meta.dirname, "__tests__")
        }
    }
});
```

- [ ] **Step 6: Create placeholder source files**

`packages/api-websockets-server/src/index.ts`:
```typescript
export {};
```

`packages/api-websockets-server/src/exports/api.ts`:
```typescript
export {};
```

- [ ] **Step 7: Install dependencies and verify build**

Run: `yarn > /dev/null 2>&1`
Run: `yarn build -p @webiny/api-websockets-server 2>&1 | tail -30`
Expected: Build succeeds (empty package compiles).

- [ ] **Step 8: Commit**

```bash
git add packages/api-websockets-server
git commit -m "chore(api-websockets-server): scaffold new package"
```

---

## Task 2: DI abstractions

**Files:**
- Create: `packages/api-websockets-server/src/abstractions.ts`
- Test: `packages/api-websockets-server/__tests__/abstractions.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import {
    WebsocketsServerAdapter,
    WebsocketsUpgradeHandler,
    WebsocketsConnectionManager
} from "~/abstractions.js";

describe("abstractions", () => {
    it("should create WebsocketsServerAdapter abstraction with namespace types", () => {
        expect(WebsocketsServerAdapter).toBeDefined();
        expect(typeof WebsocketsServerAdapter.createImplementation).toBe("function");
    });

    it("should create WebsocketsUpgradeHandler abstraction with namespace types", () => {
        expect(WebsocketsUpgradeHandler).toBeDefined();
        expect(typeof WebsocketsUpgradeHandler.createImplementation).toBe("function");
    });

    it("should create WebsocketsConnectionManager abstraction with namespace types", () => {
        expect(WebsocketsConnectionManager).toBeDefined();
        expect(typeof WebsocketsConnectionManager.createImplementation).toBe("function");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL — cannot import from `~/abstractions.js`.

- [ ] **Step 3: Implement abstractions**

`packages/api-websockets-server/src/abstractions.ts`:

```typescript
import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsIdentity } from "@webiny/api-websockets";

/* WebsocketsServerAdapter */

export interface IWebsocketsServerAdapter<TSocket> {
    start(server: HttpServer): void;
    stop(): Promise<void>;
    onConnection(cb: (socket: TSocket, request: IncomingMessage) => void): void;
    onMessage(socket: TSocket, cb: (data: Buffer) => void): void;
    onClose(socket: TSocket, cb: (code: number, reason: Buffer) => void): void;
    onError(socket: TSocket, cb: (error: Error) => void): void;
    send(socket: TSocket, data: string): Promise<void>;
    close(socket: TSocket, code?: number, reason?: string): void;
}

export const WebsocketsServerAdapter =
    createAbstraction<IWebsocketsServerAdapter<unknown>>("WebsocketsServerAdapter");

export namespace WebsocketsServerAdapter {
    export type Interface<TSocket> = IWebsocketsServerAdapter<TSocket>;
}

/* WebsocketsUpgradeHandler */

export interface IUpgradeDecisionAllowed {
    allowed: true;
}

export interface IUpgradeDecisionRejected {
    allowed: false;
    statusCode: number;
    reason: string;
}

export type UpgradeDecision = IUpgradeDecisionAllowed | IUpgradeDecisionRejected;

export interface IWebsocketsUpgradeHandler {
    shouldUpgrade(request: IncomingMessage): Promise<UpgradeDecision>;
}

export const WebsocketsUpgradeHandler =
    createAbstraction<IWebsocketsUpgradeHandler>("WebsocketsUpgradeHandler");

export namespace WebsocketsUpgradeHandler {
    export type Interface = IWebsocketsUpgradeHandler;
}

/* WebsocketsConnectionManager */

export interface IWebsocketsConnectionManagerAddParams<TSocket> {
    connectionId: string;
    socket: TSocket;
    endpoint: string;
    identity: IWebsocketsIdentity;
    tenant: string;
    connectedAt: number;
    host: string;
    headers: Record<string, string>;
}

export interface IWebsocketsConnectionManagerMetadata {
    connectionId: string;
    endpoint: string;
    connectedAt: number;
    host: string;
    headers: Record<string, string>;
}

export interface IWebsocketsConnectionManager<TSocket> {
    add(params: IWebsocketsConnectionManagerAddParams<TSocket>): Promise<void>;
    remove(connectionId: string): Promise<void>;
    getSocket(connectionId: string): TSocket | undefined;
    getMetadata(connectionId: string): IWebsocketsConnectionManagerMetadata | undefined;
    updateLastSeen(connectionId: string): Promise<void>;
    cleanup(maxAge: number): Promise<string[]>;
}

export const WebsocketsConnectionManager =
    createAbstraction<IWebsocketsConnectionManager<unknown>>("WebsocketsConnectionManager");

export namespace WebsocketsConnectionManager {
    export type Interface<TSocket> = IWebsocketsConnectionManager<TSocket>;
    export type AddParams<TSocket> = IWebsocketsConnectionManagerAddParams<TSocket>;
    export type ConnectionMetadata = IWebsocketsConnectionManagerMetadata;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/abstractions.ts packages/api-websockets-server/__tests__
git commit -m "feat(api-websockets-server): add DI abstractions"
```

---

## Task 3: Default upgrade handler

**Files:**
- Create: `packages/api-websockets-server/src/upgradeHandler/DefaultUpgradeHandler.ts`
- Test: `packages/api-websockets-server/__tests__/upgradeHandler/DefaultUpgradeHandler.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import type { IncomingMessage } from "node:http";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";

const createMockRequest = (headers: Record<string, string> = {}): IncomingMessage => {
    return { headers } as unknown as IncomingMessage;
};

describe("DefaultUpgradeHandler", () => {
    it("should allow all connections by default", async () => {
        const handler = new DefaultUpgradeHandlerImpl();
        const decision = await handler.shouldUpgrade(createMockRequest());
        expect(decision).toEqual({ allowed: true });
    });

    it("should allow connections with any headers", async () => {
        const handler = new DefaultUpgradeHandlerImpl();
        const decision = await handler.shouldUpgrade(
            createMockRequest({ origin: "http://evil.com" })
        );
        expect(decision).toEqual({ allowed: true });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL — cannot import `DefaultUpgradeHandlerImpl`.

- [ ] **Step 3: Implement DefaultUpgradeHandler**

```typescript
import type { IncomingMessage } from "node:http";
import { WebsocketsUpgradeHandler } from "~/abstractions.js";
import type { UpgradeDecision } from "~/abstractions.js";

export class DefaultUpgradeHandlerImpl implements WebsocketsUpgradeHandler.Interface {
    public async shouldUpgrade(_request: IncomingMessage): Promise<UpgradeDecision> {
        return { allowed: true };
    }
}

export const DefaultUpgradeHandler = WebsocketsUpgradeHandler.createImplementation({
    implementation: DefaultUpgradeHandlerImpl,
    dependencies: []
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/upgradeHandler packages/api-websockets-server/__tests__/upgradeHandler
git commit -m "feat(api-websockets-server): add DefaultUpgradeHandler"
```

---

## Task 4: Node WS adapter

**Files:**
- Create: `packages/api-websockets-server/src/adapter/types.ts`
- Create: `packages/api-websockets-server/src/adapter/NodeWsAdapter.ts`
- Test: `packages/api-websockets-server/__tests__/adapter/NodeWsAdapter.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import { WebSocket } from "ws";
import { NodeWsAdapterImpl } from "~/adapter/NodeWsAdapter.js";

describe("NodeWsAdapter", () => {
    let httpServer: HttpServer;
    let adapter: NodeWsAdapterImpl;
    let port: number;

    beforeEach(async () => {
        adapter = new NodeWsAdapterImpl();
        httpServer = createServer();

        await new Promise<void>(resolve => {
            httpServer.listen(0, () => {
                const addr = httpServer.address();
                port = typeof addr === "object" && addr ? addr.port : 0;
                resolve();
            });
        });

        adapter.start(httpServer);
    });

    afterEach(async () => {
        await adapter.stop();
        await new Promise<void>(resolve => {
            httpServer.close(() => resolve());
        });
    });

    it("should fire onConnection when a client connects", async () => {
        const onConnection = vi.fn();
        adapter.onConnection(onConnection);

        const client = new WebSocket(`ws://localhost:${port}`);
        await new Promise<void>(resolve => {
            client.on("open", resolve);
        });

        expect(onConnection).toHaveBeenCalledTimes(1);
        client.close();
    });

    it("should fire onMessage when a client sends data", async () => {
        const messages: string[] = [];

        adapter.onConnection((socket) => {
            adapter.onMessage(socket, (data) => {
                messages.push(data.toString());
            });
        });

        const client = new WebSocket(`ws://localhost:${port}`);
        await new Promise<void>(resolve => {
            client.on("open", resolve);
        });

        client.send("hello");

        await new Promise<void>(resolve => setTimeout(resolve, 50));
        expect(messages).toEqual(["hello"]);
        client.close();
    });

    it("should send data to a client", async () => {
        const received: string[] = [];
        let serverSocket: WebSocket | undefined;

        adapter.onConnection((socket) => {
            serverSocket = socket;
        });

        const client = new WebSocket(`ws://localhost:${port}`);
        client.on("message", (data) => {
            received.push(data.toString());
        });

        await new Promise<void>(resolve => {
            client.on("open", resolve);
        });

        await adapter.send(serverSocket!, JSON.stringify({ action: "test" }));

        await new Promise<void>(resolve => setTimeout(resolve, 50));
        expect(received).toEqual([JSON.stringify({ action: "test" })]);
        client.close();
    });

    it("should close a client connection", async () => {
        let serverSocket: WebSocket | undefined;

        adapter.onConnection((socket) => {
            serverSocket = socket;
        });

        const client = new WebSocket(`ws://localhost:${port}`);
        await new Promise<void>(resolve => {
            client.on("open", resolve);
        });

        const closed = new Promise<void>(resolve => {
            client.on("close", () => resolve());
        });

        adapter.close(serverSocket!);
        await closed;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL — cannot import `NodeWsAdapterImpl`.

- [ ] **Step 3: Implement the adapter**

`packages/api-websockets-server/src/adapter/types.ts`:
```typescript
import type { WebSocket } from "ws";

export type NodeSocket = WebSocket;
```

`packages/api-websockets-server/src/adapter/NodeWsAdapter.ts`:
```typescript
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebsocketsServerAdapter } from "~/abstractions.js";

export class NodeWsAdapterImpl implements WebsocketsServerAdapter.Interface<WebSocket> {
    private wss: WebSocketServer | undefined;

    public start(server: HttpServer): void {
        this.wss = new WebSocketServer({ server });
    }

    public async stop(): Promise<void> {
        if (!this.wss) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this.wss!.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        this.wss = undefined;
    }

    public onConnection(cb: (socket: WebSocket, request: IncomingMessage) => void): void {
        this.getWss().on("connection", cb);
    }

    public onMessage(socket: WebSocket, cb: (data: Buffer) => void): void {
        socket.on("message", cb);
    }

    public onClose(socket: WebSocket, cb: (code: number, reason: Buffer) => void): void {
        socket.on("close", cb);
    }

    public onError(socket: WebSocket, cb: (error: Error) => void): void {
        socket.on("error", cb);
    }

    public async send(socket: WebSocket, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            socket.send(data, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    public close(socket: WebSocket, code?: number, reason?: string): void {
        socket.close(code, reason);
    }

    private getWss(): WebSocketServer {
        if (!this.wss) {
            throw new Error("WebSocketServer not started. Call start() first.");
        }
        return this.wss;
    }
}

export const NodeWsAdapter = WebsocketsServerAdapter.createImplementation({
    implementation: NodeWsAdapterImpl,
    dependencies: []
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/adapter packages/api-websockets-server/__tests__/adapter
git commit -m "feat(api-websockets-server): add NodeWsAdapter"
```

---

## Task 5: Connection manager

**Files:**
- Create: `packages/api-websockets-server/src/connectionManager/ServerConnectionManager.ts`
- Test: `packages/api-websockets-server/__tests__/connectionManager/ServerConnectionManager.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";

const createMockRegistry = (): IWebsocketsConnectionRegistry => ({
    register: vi.fn().mockResolvedValue({}),
    unregister: vi.fn().mockResolvedValue(undefined),
    listViaConnections: vi.fn().mockResolvedValue([]),
    listViaIdentity: vi.fn().mockResolvedValue([]),
    listViaTenant: vi.fn().mockResolvedValue([]),
    listAll: vi.fn().mockResolvedValue([]),
    updateLastSeen: vi.fn().mockResolvedValue(undefined),
    listStale: vi.fn().mockResolvedValue([])
});

const identity = { id: "id-1", displayName: "Test User", type: "admin" };
const mockSocket = { fake: true };

describe("ServerConnectionManager", () => {
    let registry: ReturnType<typeof createMockRegistry>;
    let manager: ServerConnectionManagerImpl;

    beforeEach(() => {
        registry = createMockRegistry();
        manager = new ServerConnectionManagerImpl(registry);
    });

    it("should add a connection to the local map", async () => {
        await manager.add({
            connectionId: "conn-1",
            socket: mockSocket,
            endpoint: "ws://localhost:8080",
            identity,
            tenant: "root",
            connectedAt: Date.now(),
            host: "localhost",
            headers: {}
        });

        expect(manager.getSocket("conn-1")).toBe(mockSocket);
        expect(manager.getMetadata("conn-1")).toMatchObject({
            connectionId: "conn-1",
            endpoint: "ws://localhost:8080",
            host: "localhost"
        });
    });

    it("should not call registry.register on add", async () => {
        await manager.add({
            connectionId: "conn-1",
            socket: mockSocket,
            endpoint: "ws://localhost:8080",
            identity,
            tenant: "root",
            connectedAt: Date.now(),
            host: "localhost",
            headers: {}
        });

        expect(registry.register).not.toHaveBeenCalled();
    });

    it("should remove a connection from the local map and registry", async () => {
        await manager.add({
            connectionId: "conn-1",
            socket: mockSocket,
            endpoint: "ws://localhost:8080",
            identity,
            tenant: "root",
            connectedAt: Date.now(),
            host: "localhost",
            headers: {}
        });

        await manager.remove("conn-1");

        expect(manager.getSocket("conn-1")).toBeUndefined();
        expect(manager.getMetadata("conn-1")).toBeUndefined();
        expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "conn-1" });
    });

    it("should swallow CONNECTION_NOT_FOUND on remove", async () => {
        const error = new Error("Connection not found");
        (error as any).code = "CONNECTION_NOT_FOUND";
        registry.unregister = vi.fn().mockRejectedValue(error);

        await expect(manager.remove("conn-nonexistent")).resolves.toBeUndefined();
    });

    it("should rethrow non-CONNECTION_NOT_FOUND errors on remove", async () => {
        const error = new Error("Database error");
        (error as any).code = "DB_ERROR";
        registry.unregister = vi.fn().mockRejectedValue(error);

        await expect(manager.remove("conn-1")).rejects.toThrow("Database error");
    });

    it("should delegate updateLastSeen to registry", async () => {
        await manager.updateLastSeen("conn-1");
        expect(registry.updateLastSeen).toHaveBeenCalledWith("conn-1");
    });

    it("should cleanup stale connections", async () => {
        await manager.add({
            connectionId: "conn-stale",
            socket: mockSocket,
            endpoint: "ws://localhost:8080",
            identity,
            tenant: "root",
            connectedAt: Date.now(),
            host: "localhost",
            headers: {}
        });

        registry.listStale = vi.fn().mockResolvedValue([
            {
                connectionId: "conn-stale",
                identity,
                tenant: "root",
                endpoint: "ws://localhost:8080",
                connectedOn: new Date().toISOString()
            }
        ]);

        const removed = await manager.cleanup(300000);

        expect(removed).toEqual(["conn-stale"]);
        expect(manager.getSocket("conn-stale")).toBeUndefined();
        expect(registry.unregister).toHaveBeenCalledWith({ connectionId: "conn-stale" });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL — cannot import `ServerConnectionManagerImpl`.

- [ ] **Step 3: Implement ServerConnectionManager**

```typescript
import type { IWebsocketsConnectionRegistry } from "@webiny/api-websockets";
import { ConnectionRegistry } from "@webiny/api-websockets";
import { WebsocketsConnectionManager } from "~/abstractions.js";

export class ServerConnectionManagerImpl implements WebsocketsConnectionManager.Interface<unknown> {
    private readonly sockets = new Map<string, unknown>();
    private readonly metadata = new Map<string, WebsocketsConnectionManager.ConnectionMetadata>();
    private readonly registry: IWebsocketsConnectionRegistry;

    public constructor(registry: ConnectionRegistry.Interface) {
        this.registry = registry;
    }

    public async add(params: WebsocketsConnectionManager.AddParams<unknown>): Promise<void> {
        this.sockets.set(params.connectionId, params.socket);
        this.metadata.set(params.connectionId, {
            connectionId: params.connectionId,
            endpoint: params.endpoint,
            connectedAt: params.connectedAt,
            host: params.host,
            headers: params.headers
        });
    }

    public async remove(connectionId: string): Promise<void> {
        this.sockets.delete(connectionId);
        this.metadata.delete(connectionId);

        try {
            await this.registry.unregister({ connectionId });
        } catch (err) {
            if ((err as any).code === "CONNECTION_NOT_FOUND") {
                return;
            }
            throw err;
        }
    }

    public getSocket(connectionId: string): unknown | undefined {
        return this.sockets.get(connectionId);
    }

    public getMetadata(connectionId: string): WebsocketsConnectionManager.ConnectionMetadata | undefined {
        return this.metadata.get(connectionId);
    }

    public async updateLastSeen(connectionId: string): Promise<void> {
        await this.registry.updateLastSeen(connectionId);
    }

    public async cleanup(maxAge: number): Promise<string[]> {
        const olderThan = new Date(Date.now() - maxAge);
        const stale = await this.registry.listStale(olderThan);
        const removed: string[] = [];

        for (const entry of stale) {
            await this.remove(entry.connectionId);
            removed.push(entry.connectionId);
        }

        return removed;
    }
}

export const ServerConnectionManager = WebsocketsConnectionManager.createImplementation({
    implementation: ServerConnectionManagerImpl,
    dependencies: [ConnectionRegistry]
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/connectionManager packages/api-websockets-server/__tests__/connectionManager
git commit -m "feat(api-websockets-server): add ServerConnectionManager"
```

---

## Task 6: Event validator

**Files:**
- Create: `packages/api-websockets-server/src/validator/ServerWebsocketsEventValidator.ts`
- Test: `packages/api-websockets-server/__tests__/validator/ServerWebsocketsEventValidator.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { ServerWebsocketsEventValidator } from "~/validator/ServerWebsocketsEventValidator.js";

describe("ServerWebsocketsEventValidator", () => {
    const validator = new ServerWebsocketsEventValidator();

    it("should validate a connect event", async () => {
        const result = await validator.validate({
            headers: { host: "localhost:8080", authorization: "Bearer token123" },
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "connect",
                route: "connect",
                endpoint: "ws://localhost:8080"
            },
            body: undefined
        });

        expect(result).toEqual({
            headers: { host: "localhost:8080", authorization: "Bearer token123" },
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "connect",
                route: "connect",
                endpoint: "ws://localhost:8080"
            },
            body: undefined
        });
    });

    it("should validate a message event with parsed body", async () => {
        const result = await validator.validate({
            headers: { host: "localhost:8080" },
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "message",
                route: "default",
                endpoint: "ws://localhost:8080"
            },
            body: {
                token: "token123",
                tenant: "root",
                messageId: "msg-1",
                action: "subscribe",
                data: { channel: "updates" }
            }
        });

        expect(result.context.eventType).toBe("message");
        expect(result.context.route).toBe("default");
        expect(result.body).toEqual({
            token: "token123",
            tenant: "root",
            messageId: "msg-1",
            action: "subscribe",
            data: { channel: "updates" }
        });
    });

    it("should use body.action as route when provided", async () => {
        const result = await validator.validate({
            headers: {},
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "message",
                route: "default",
                endpoint: "ws://localhost:8080"
            },
            body: {
                action: "custom-route",
                data: {}
            }
        });

        expect(result.context.route).toBe("custom-route");
    });

    it("should validate a disconnect event", async () => {
        const result = await validator.validate({
            headers: {},
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "disconnect",
                route: "disconnect",
                endpoint: "ws://localhost:8080"
            },
            body: undefined
        });

        expect(result.context.eventType).toBe("disconnect");
        expect(result.context.route).toBe("disconnect");
        expect(result.body).toBeUndefined();
    });

    it("should throw on message event with no body", async () => {
        await expect(
            validator.validate({
                headers: {},
                context: {
                    connectionId: "conn-1",
                    connectedAt: 1718000000000,
                    host: "localhost",
                    eventType: "message",
                    route: "default",
                    endpoint: "ws://localhost:8080"
                },
                body: undefined
            })
        ).rejects.toThrow("Message event must have a body.");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL.

- [ ] **Step 3: Implement the validator**

```typescript
import { WebinyError } from "@webiny/error";
import type {
    IWebsocketsEventValidator,
    IWebsocketsEvent,
    IWebsocketsEventData
} from "@webiny/api-websockets";

export class ServerWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>> {
        const event = input as IWebsocketsEvent<T>;

        if (event.context.eventType === "message" && !event.body) {
            throw new WebinyError(
                "Message event must have a body.",
                "VALIDATION_FAILED_NO_BODY"
            );
        }

        if (event.context.eventType === "message" && event.body?.action) {
            event.context.route = event.body.action;
        }

        return event;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/validator packages/api-websockets-server/__tests__/validator
git commit -m "feat(api-websockets-server): add ServerWebsocketsEventValidator"
```

---

## Task 7: Server transport

**Files:**
- Create: `packages/api-websockets-server/src/transport/ServerWebsocketsTransport.ts`
- Test: `packages/api-websockets-server/__tests__/transport/ServerWebsocketsTransport.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServerWebsocketsTransportImpl } from "~/transport/ServerWebsocketsTransport.js";
import type { IWebsocketsConnectionManager } from "~/abstractions.js";
import type { IWebsocketsServerAdapter } from "~/abstractions.js";

const createMockAdapter = (): IWebsocketsServerAdapter<unknown> => ({
    start: vi.fn(),
    stop: vi.fn(),
    onConnection: vi.fn(),
    onMessage: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn()
});

const createMockManager = (): IWebsocketsConnectionManager<unknown> => ({
    add: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
    getSocket: vi.fn(),
    getMetadata: vi.fn(),
    updateLastSeen: vi.fn(),
    cleanup: vi.fn()
});

describe("ServerWebsocketsTransport", () => {
    let adapter: ReturnType<typeof createMockAdapter>;
    let manager: ReturnType<typeof createMockManager>;
    let transport: ServerWebsocketsTransportImpl;

    beforeEach(() => {
        adapter = createMockAdapter();
        manager = createMockManager();
        transport = new ServerWebsocketsTransportImpl(manager, adapter);
    });

    it("should send data to connections via adapter", async () => {
        const socket = { fake: true };
        manager.getSocket = vi.fn().mockReturnValue(socket);

        await transport.send(
            [{ connectionId: "conn-1", endpoint: "ws://localhost:8080" }],
            { action: "test", data: { value: 1 } }
        );

        expect(adapter.send).toHaveBeenCalledWith(
            socket,
            JSON.stringify({ action: "test", data: { value: 1 } })
        );
    });

    it("should remove stale connections when socket not found on send", async () => {
        manager.getSocket = vi.fn().mockReturnValue(undefined);

        await transport.send(
            [{ connectionId: "conn-stale", endpoint: "ws://localhost:8080" }],
            { data: {} }
        );

        expect(manager.remove).toHaveBeenCalledWith("conn-stale");
        expect(adapter.send).not.toHaveBeenCalled();
    });

    it("should disconnect connections via adapter", async () => {
        const socket = { fake: true };
        manager.getSocket = vi.fn().mockReturnValue(socket);

        await transport.disconnect([
            { connectionId: "conn-1", endpoint: "ws://localhost:8080" }
        ]);

        expect(adapter.close).toHaveBeenCalledWith(socket);
        expect(manager.remove).toHaveBeenCalledWith("conn-1");
    });

    it("should remove stale connections when socket not found on disconnect", async () => {
        manager.getSocket = vi.fn().mockReturnValue(undefined);

        await transport.disconnect([
            { connectionId: "conn-stale", endpoint: "ws://localhost:8080" }
        ]);

        expect(manager.remove).toHaveBeenCalledWith("conn-stale");
        expect(adapter.close).not.toHaveBeenCalled();
    });

    it("should log and continue when send fails for one connection", async () => {
        const socket1 = { id: 1 };
        const socket2 = { id: 2 };

        let callCount = 0;
        manager.getSocket = vi.fn().mockImplementation((id: string) => {
            return id === "conn-1" ? socket1 : socket2;
        });
        adapter.send = vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
                throw new Error("send failed");
            }
        });

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        await transport.send(
            [
                { connectionId: "conn-1", endpoint: "ws://localhost:8080" },
                { connectionId: "conn-2", endpoint: "ws://localhost:8080" }
            ],
            { data: {} }
        );

        expect(consoleSpy).toHaveBeenCalled();
        expect(adapter.send).toHaveBeenCalledTimes(2);

        consoleSpy.mockRestore();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL.

- [ ] **Step 3: Implement the transport**

```typescript
import type { GenericRecord } from "@webiny/api/types.js";
import { WebsocketsTransport } from "@webiny/api-websockets";
import {
    WebsocketsConnectionManager,
    WebsocketsServerAdapter
} from "~/abstractions.js";

export class ServerWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    private readonly adapter: WebsocketsServerAdapter.Interface<unknown>;

    public constructor(
        connectionManager: WebsocketsConnectionManager.Interface<unknown>,
        adapter: WebsocketsServerAdapter.Interface<unknown>
    ) {
        this.connectionManager = connectionManager;
        this.adapter = adapter;
    }

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            try {
                const socket = this.connectionManager.getSocket(connection.connectionId);

                if (!socket) {
                    await this.connectionManager.remove(connection.connectionId);
                    continue;
                }

                await this.adapter.send(socket, JSON.stringify(data));
            } catch (ex) {
                console.error(
                    `Failed to send message to connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    public async disconnect(connections: WebsocketsTransport.DisconnectConnection[]): Promise<void> {
        for (const connection of connections) {
            try {
                const socket = this.connectionManager.getSocket(connection.connectionId);

                if (!socket) {
                    await this.connectionManager.remove(connection.connectionId);
                    continue;
                }

                this.adapter.close(socket);
                await this.connectionManager.remove(connection.connectionId);
            } catch (ex) {
                console.error(
                    `Failed to disconnect connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }
}

export const ServerWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: ServerWebsocketsTransportImpl,
    dependencies: [WebsocketsConnectionManager, WebsocketsServerAdapter]
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/transport packages/api-websockets-server/__tests__/transport
git commit -m "feat(api-websockets-server): add ServerWebsocketsTransport"
```

---

## Task 8: Server lifecycle orchestrator

**Files:**
- Create: `packages/api-websockets-server/src/server/types.ts`
- Create: `packages/api-websockets-server/src/server/WebsocketsServer.ts`
- Test: `packages/api-websockets-server/__tests__/server/WebsocketsServer.test.ts`

- [ ] **Step 1: Create server config types**

`packages/api-websockets-server/src/server/types.ts`:

```typescript
import type { Server as HttpServer } from "node:http";
import type { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";

interface BaseServerParams {
    plugins?: PluginsContainer | PluginCollection;
    heartbeatInterval?: number;
    debug?: boolean;
}

export interface CreateWebsocketsServerParams extends BaseServerParams {
    port?: number;
    host?: string;
}

export interface AttachWebsocketsServerParams extends BaseServerParams {
    server: HttpServer;
}

export interface IWebsocketsServer {
    start(): Promise<void>;
    stop(): Promise<void>;
}
```

- [ ] **Step 2: Write the test**

This test validates the full lifecycle with a real `ws` server and client. It verifies that connections flow through the event system properly.

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { WebSocket } from "ws";
import { createWebsocketsServer } from "~/server/WebsocketsServer.js";

describe("WebsocketsServer", () => {
    let server: Awaited<ReturnType<typeof createWebsocketsServer>> | undefined;

    afterEach(async () => {
        if (server) {
            await server.stop();
            server = undefined;
        }
    });

    it("should start and stop without errors", async () => {
        server = createWebsocketsServer({
            port: 0,
            host: "127.0.0.1"
        });

        await server.start();
        await server.stop();
        server = undefined;
    });

    it("should accept WebSocket connections", async () => {
        server = createWebsocketsServer({
            port: 0,
            host: "127.0.0.1"
        });

        await server.start();

        const port = server.port();
        const client = new WebSocket(`ws://127.0.0.1:${port}`);

        await new Promise<void>((resolve, reject) => {
            client.on("open", resolve);
            client.on("error", reject);
        });

        client.close();
        await new Promise<void>(resolve => {
            client.on("close", resolve);
        });
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: FAIL.

- [ ] **Step 4: Implement WebsocketsServer**

`packages/api-websockets-server/src/server/WebsocketsServer.ts`:

```typescript
import { createServer } from "node:http";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import { mdbid } from "@webiny/utils";
import { WebsocketsResponse } from "@webiny/api-websockets/response/WebsocketsResponse.js";
import {
    WebsocketsRunner,
    createWebsocketsRoutePlugins
} from "@webiny/api-websockets";
import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context } from "@webiny/api-websockets";
import { NodeWsAdapterImpl } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { ServerWebsocketsEventValidator } from "~/validator/ServerWebsocketsEventValidator.js";
import type {
    CreateWebsocketsServerParams,
    AttachWebsocketsServerParams,
    IWebsocketsServer
} from "./types.js";

interface ServerState {
    httpServer: HttpServer;
    ownsHttpServer: boolean;
    adapter: NodeWsAdapterImpl;
    upgradeHandler: DefaultUpgradeHandlerImpl;
    connectionManager: ServerConnectionManagerImpl;
    validator: ServerWebsocketsEventValidator;
    runner: WebsocketsRunner | undefined;
    heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    heartbeatInterval: number;
    shuttingDown: boolean;
    endpoint: string;
    resolvedPort: number;
}

const DEFAULT_HEARTBEAT_INTERVAL = 60000;

const createState = (
    httpServer: HttpServer,
    ownsHttpServer: boolean,
    heartbeatInterval: number
): ServerState => {
    return {
        httpServer,
        ownsHttpServer,
        adapter: new NodeWsAdapterImpl(),
        upgradeHandler: new DefaultUpgradeHandlerImpl(),
        connectionManager: undefined as unknown as ServerConnectionManagerImpl,
        validator: new ServerWebsocketsEventValidator(),
        runner: undefined,
        heartbeatTimer: undefined,
        heartbeatInterval,
        shuttingDown: false,
        endpoint: "",
        resolvedPort: 0
    };
};

const toHeaders = (raw: IncomingMessage["headers"]): Record<string, string> => {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string") {
            headers[key] = value;
        }
    }
    return headers;
};

class WebsocketsServerImpl implements IWebsocketsServer {
    private readonly state: ServerState;
    private readonly plugins: PluginsContainer;

    public constructor(state: ServerState, plugins?: PluginsContainer | PluginCollection) {
        this.state = state;
        this.plugins = plugins instanceof PluginsContainer
            ? plugins
            : new PluginsContainer(plugins || []);
        this.plugins.register(...createWebsocketsRoutePlugins());
    }

    public port(): number {
        return this.state.resolvedPort;
    }

    public async start(): Promise<void> {
        this.state.adapter.start(this.state.httpServer);
        this.wireEvents();

        if (this.state.ownsHttpServer) {
            await new Promise<void>(resolve => {
                this.state.httpServer.listen(this.state.resolvedPort, () => {
                    const addr = this.state.httpServer.address();
                    if (typeof addr === "object" && addr) {
                        this.state.resolvedPort = addr.port;
                    }
                    this.state.endpoint =
                        `ws://localhost:${this.state.resolvedPort}`;
                    resolve();
                });
            });
        }

        this.startHeartbeat();
    }

    public async stop(): Promise<void> {
        this.state.shuttingDown = true;
        this.stopHeartbeat();

        await this.state.adapter.stop();

        if (this.state.ownsHttpServer) {
            await new Promise<void>((resolve, reject) => {
                this.state.httpServer.close(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        }
    }

    private wireEvents(): void {
        this.state.adapter.onConnection((socket, request) => {
            if (this.state.shuttingDown) {
                return;
            }

            const connectionId = mdbid();
            const connectedAt = Date.now();
            const host = request.headers.host || "localhost";
            const headers = toHeaders(request.headers);

            this.state.connectionManager?.add({
                connectionId,
                socket,
                endpoint: this.state.endpoint,
                identity: { id: "", displayName: "", type: "" },
                tenant: "",
                connectedAt,
                host,
                headers
            });

            if (this.state.runner) {
                const event = {
                    headers,
                    context: {
                        connectionId,
                        connectedAt,
                        host,
                        eventType: "connect" as const,
                        route: "connect" as const,
                        endpoint: this.state.endpoint
                    },
                    body: undefined
                };

                this.state.validator.validate(event).then(validated => {
                    this.state.runner!.run(validated);
                });
            }

            this.state.adapter.onMessage(socket, data => {
                if (this.state.shuttingDown || !this.state.runner) {
                    return;
                }

                const metadata = this.state.connectionManager?.getMetadata(connectionId);
                if (!metadata) {
                    return;
                }

                let body;
                try {
                    body = JSON.parse(data.toString());
                } catch {
                    return;
                }

                const event = {
                    headers: metadata.headers,
                    context: {
                        connectionId,
                        connectedAt: metadata.connectedAt,
                        host: metadata.host,
                        eventType: "message" as const,
                        route: "default" as const,
                        endpoint: metadata.endpoint
                    },
                    body
                };

                this.state.validator.validate(event).then(validated => {
                    this.state.runner!.run(validated);
                });

                this.state.connectionManager?.updateLastSeen(connectionId);
            });

            this.state.adapter.onClose(socket, () => {
                if (this.state.shuttingDown) {
                    return;
                }

                const metadata = this.state.connectionManager?.getMetadata(connectionId);

                if (this.state.runner && metadata) {
                    const event = {
                        headers: metadata.headers,
                        context: {
                            connectionId,
                            connectedAt: metadata.connectedAt,
                            host: metadata.host,
                            eventType: "disconnect" as const,
                            route: "disconnect" as const,
                            endpoint: metadata.endpoint
                        },
                        body: undefined
                    };

                    this.state.validator.validate(event).then(validated => {
                        this.state.runner!.run(validated);
                    });
                }

                this.state.connectionManager?.remove(connectionId);
            });

            this.state.adapter.onError(socket, error => {
                console.error(
                    `WebSocket error for connection "${connectionId}":`,
                    error.message
                );
            });
        });
    }

    private startHeartbeat(): void {
        if (this.state.heartbeatInterval <= 0) {
            return;
        }

        const maxAge = this.state.heartbeatInterval * 5;

        this.state.heartbeatTimer = setInterval(() => {
            this.state.connectionManager?.cleanup(maxAge);
        }, this.state.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (this.state.heartbeatTimer) {
            clearInterval(this.state.heartbeatTimer);
            this.state.heartbeatTimer = undefined;
        }
    }
}

export const createWebsocketsServer = (
    params: CreateWebsocketsServerParams
): WebsocketsServerImpl => {
    const port = params.port || 8080;
    const httpServer = createServer();
    const state = createState(
        httpServer,
        true,
        params.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
    );
    state.resolvedPort = port;

    return new WebsocketsServerImpl(state, params.plugins);
};

export const attachWebsocketsServer = (
    params: AttachWebsocketsServerParams
): WebsocketsServerImpl => {
    const state = createState(
        params.server,
        false,
        params.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
    );

    return new WebsocketsServerImpl(state, params.plugins);
};
```

Note: The `connectionManager` is set to `undefined` initially. During the full context bootstrap (Task 9), it will be resolved from the DI container. For now the test only verifies start/stop and raw connection acceptance.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -30`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api-websockets-server/src/server packages/api-websockets-server/__tests__/server
git commit -m "feat(api-websockets-server): add WebsocketsServer lifecycle orchestrator"
```

---

## Task 9: DI plugin and package exports

**Files:**
- Modify: `packages/api-websockets-server/src/index.ts`
- Modify: `packages/api-websockets-server/src/exports/api.ts`

- [ ] **Step 1: Implement `createServerWebsockets()` in `index.ts`**

```typescript
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";
import { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
import { DefaultUpgradeHandler } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";

export { createWebsocketsServer, attachWebsocketsServer } from "~/server/WebsocketsServer.js";
export type { IWebsocketsServer } from "~/server/types.js";
export * from "~/abstractions.js";

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

- [ ] **Step 2: Implement `exports/api.ts`**

```typescript
export {
    createServerWebsockets,
    createWebsocketsServer,
    attachWebsocketsServer
} from "~/index.js";
export type { IWebsocketsServer } from "~/server/types.js";
```

- [ ] **Step 3: Build the package**

Run: `yarn build -p @webiny/api-websockets-server 2>&1 | tail -30`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/api-websockets-server/src/index.ts packages/api-websockets-server/src/exports
git commit -m "feat(api-websockets-server): add DI plugin and package exports"
```

---

## Task 10: Run full pre-commit checklist and final build

- [ ] **Step 1: Run all tests in the new package**

Run: `yarn test packages/api-websockets-server 2>&1 | tail -50`
Expected: All tests pass.

- [ ] **Step 2: Run tests in affected packages**

Run: `yarn test packages/api-websockets 2>&1 | tail -50`
Run: `yarn test packages/api-websockets-sql 2>&1 | tail -50`
Run: `yarn test packages/api-websockets-ddb 2>&1 | tail -50`
Expected: All existing tests still pass.

- [ ] **Step 3: Run the full pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 4: Build all affected packages**

Run: `yarn build -p @webiny/api-websockets -p @webiny/api-websockets-sql -p @webiny/api-websockets-ddb -p @webiny/api-websockets-server 2>&1 | tail -30`
Expected: All 4 packages build successfully.

- [ ] **Step 5: Final commit**

```bash
git commit -m "chore(api-websockets-server): pre-commit checklist pass"
```

---

## Task 11: Update ai-context docs

- [ ] **Step 1: Add the new package to `ai-context/core-features-reference.md`**

Add an entry for `@webiny/api-websockets-server` under the websockets section, documenting:
- Package purpose (self-hosted WebSocket server transport)
- Key exports (`createServerWebsockets`, `createWebsocketsServer`, `attachWebsocketsServer`)
- DI abstractions (`WebsocketsServerAdapter`, `WebsocketsUpgradeHandler`, `WebsocketsConnectionManager`)

- [ ] **Step 2: Commit**

```bash
git add ai-context/core-features-reference.md
git commit -m "docs: add api-websockets-server to core features reference"
```
