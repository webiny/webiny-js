# api-websockets Storage Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `api-websockets` into a storage-agnostic base package plus `api-websockets-ddb` and `api-websockets-sql` storage implementations.

**Architecture:** The base package keeps all websocket logic (context, transport, runner, graphql, handler) and defines a `ConnectionRegistry` DI abstraction. Storage packages provide concrete implementations — DDB uses toolbox entities with PK/SK+GSI pattern, SQL uses Knex with a `WebsocketsConnections` table. Each storage package exports a `registerWebsocketsDdbStorageOperations` / `registerWebsocketsSqlStorageOperations` function that registers its implementation into the DI container, following the `api-aco` / `api-aco-ddb` / `api-aco-sql` pattern.

**Tech Stack:** TypeScript ESM, `@webiny/feature` DI, `@webiny/db-dynamodb` toolbox (DDB), Knex (SQL)

---

## File Structure

### Base package (`packages/api-websockets`)

**Modify:**
- `src/registry/abstractions/IWebsocketsConnectionRegistry.ts` — already clean, no changes
- `src/registry/index.ts` — remove DDB impl re-export, add DI abstraction export
- `src/context/index.ts` — resolve registry from DI container instead of hardcoding DDB
- `src/index.ts` — stop re-exporting DDB registry class
- `package.json` — remove `@webiny/db-dynamodb` from dependencies

**Create:**
- `src/features/ConnectionRegistry/abstractions.ts` — DI abstraction token (`ConnectionRegistry`)

**Delete:**
- `src/registry/entity.ts` — moves to `api-websockets-ddb`
- `src/registry/WebsocketsConnectionRegistry.ts` — moves to `api-websockets-ddb`

### DDB package (`packages/api-websockets-ddb`)

**Create:**
- `package.json`
- `tsconfig.json` (auto-generated)
- `tsconfig.build.json` (auto-generated)
- `src/index.ts` — `registerWebsocketsDdbStorageOperations({ documentClient })`
- `src/WebsocketsConnectionRegistry.ts` — moved from base, import abstraction types from `@webiny/api-websockets`
- `src/entity.ts` — moved from base

### SQL package (`packages/api-websockets-sql`)

**Create:**
- `package.json`
- `tsconfig.json` (auto-generated)
- `tsconfig.build.json` (auto-generated)
- `src/index.ts` — `registerWebsocketsSqlStorageOperations({ knex })`
- `src/WebsocketsConnectionRegistry.ts` — Knex implementation of `IWebsocketsConnectionRegistry`
- `src/migrations/createWebsocketsConnectionsTable.ts` — table creation migration

### Templates & consumers

**Modify:**
- `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts` — add `registerWebsocketsDdbStorageOperations({ documentClient })`
- `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts` — add `registerWebsocketsDdbStorageOperations({ documentClient })`
- `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts` — add `registerWebsocketsSqlStorageOperations({ knex })`

### Tests

**Move:**
- `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts` → `packages/api-websockets-ddb/__tests__/`

---

## Tasks

### Task 1: Create DI abstraction in base package

**Files:**
- Create: `packages/api-websockets/src/features/ConnectionRegistry/abstractions.ts`

- [ ] **Step 1: Create the DI abstraction token**

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/abstractions/IWebsocketsConnectionRegistry.js";

export const ConnectionRegistry = createAbstraction<IWebsocketsConnectionRegistry>("ConnectionRegistry");

export namespace ConnectionRegistry {
    export type Interface = IWebsocketsConnectionRegistry;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-websockets/src/features/ConnectionRegistry/abstractions.ts
git commit -m "feat(api-websockets): add ConnectionRegistry DI abstraction"
```

### Task 2: Refactor base package to use DI

**Files:**
- Modify: `packages/api-websockets/src/context/index.ts`
- Modify: `packages/api-websockets/src/registry/index.ts`
- Modify: `packages/api-websockets/src/index.ts`
- Delete: `packages/api-websockets/src/registry/entity.ts`
- Delete: `packages/api-websockets/src/registry/WebsocketsConnectionRegistry.ts`
- Modify: `packages/api-websockets/package.json`

- [ ] **Step 1: Update context to resolve registry from DI container**

Replace `packages/api-websockets/src/context/index.ts` with:

```ts
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WebsocketsContext as WebsocketsImplementation } from "./WebsocketsContext.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

export type * from "./abstractions/IWebsocketsContext.js";

export const createWebsocketsContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const registry = context.container.resolve(ConnectionRegistry);
        const transport = new WebsocketsTransport();
        context.websockets = new WebsocketsImplementation(registry, transport);

        context.container.registerInstance(WebsocketService, context.websockets);
    });

    plugin.name = "websockets.context";

    return plugin;
};
```

- [ ] **Step 2: Update registry/index.ts — remove DDB impl, export only abstractions**

Replace `packages/api-websockets/src/registry/index.ts` with:

```ts
export type * from "./abstractions/IWebsocketsConnectionRegistry.js";
```

- [ ] **Step 3: Update src/index.ts — remove DDB registry re-export, add ConnectionRegistry export**

Replace `packages/api-websockets/src/index.ts` with:

```ts
import "./handler/register.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { createWebsocketsContext } from "~/context/index.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const createWebsockets = (): Plugin[] => {
    return [createWebsocketsContext(), createWebsocketsGraphQL()];
};

export * from "./validator/index.js";
export * from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";
export * from "./context/index.js";
export * from "./features/ConnectionRegistry/abstractions.js";

export * from "./plugins/index.js";
export type * from "./types.js";
```

- [ ] **Step 4: Delete DDB-specific files from base**

```bash
rm packages/api-websockets/src/registry/entity.ts
rm packages/api-websockets/src/registry/WebsocketsConnectionRegistry.ts
```

- [ ] **Step 5: Remove `@webiny/db-dynamodb` from package.json dependencies**

In `packages/api-websockets/package.json`, remove `"@webiny/db-dynamodb": "0.0.0"` from `dependencies`.

- [ ] **Step 6: Run checklist and build**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
yarn build -p @webiny/api-websockets 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "refactor(api-websockets): remove DDB coupling, resolve registry from DI"
```

### Task 3: Create `api-websockets-ddb` package

**Files:**
- Create: `packages/api-websockets-ddb/package.json`
- Create: `packages/api-websockets-ddb/src/index.ts`
- Create: `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`
- Create: `packages/api-websockets-ddb/src/entity.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/api-websockets-ddb",
  "version": "0.0.0",
  "type": "module",
  "keywords": [
    "@webiny/api-websockets",
    "storage-operations",
    "dynamodb",
    "ddb",
    "sau:ddb"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git"
  },
  "description": "DynamoDB storage operations for @webiny/api-websockets.",
  "author": "Webiny Ltd.",
  "license": "MIT",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "dependencies": {
    "@webiny/api-websockets": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/db-dynamodb": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/handler": "0.0.0"
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

- [ ] **Step 2: Create entity.ts** (moved from base, update imports)

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStandardEntity, createTable } from "@webiny/db-dynamodb";
import type { IWebsocketsConnectionRegistryData } from "@webiny/api-websockets";

const name = "SocketsConnectionRegistry";

export const createEntity = (documentClient: DynamoDBDocument) => {
    const table = createTable({
        name: String(process.env.DB_TABLE),
        documentClient
    });

    return createStandardEntity<IWebsocketsConnectionRegistryData>({
        name,
        table: table.table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI1_PK: {
                type: "string",
                required: true
            },
            GSI1_SK: {
                type: "string",
                required: true
            },
            GSI2_PK: {
                type: "string",
                required: true
            },
            GSI2_SK: {
                type: "string",
                required: true
            },
            TYPE: {
                type: "string",
                default: name,
                required: true
            },
            data: {
                type: "map",
                required: true
            }
        }
    });
};
```

- [ ] **Step 3: Create WebsocketsConnectionRegistry.ts** (moved from base, update imports)

```ts
import WebinyError from "@webiny/error";
import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "@webiny/api-websockets";
import { createEntity } from "./entity.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";

const PK = `WS#CONNECTIONS`;
const GSI1_PK = "WS#CONNECTIONS#IDENTITY";
const GSI2_PK = "WS#CONNECTIONS#TENANT";

export class WebsocketsConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly entity;

    public constructor(documentClient: DynamoDBDocument) {
        this.entity = createEntity(documentClient);
    }

    public async register(
        params: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        const { connectionId, tenant, identity, domainName, stage, connectedOn } = params;

        const data: IWebsocketsConnectionRegistryData = {
            connectionId,
            identity,
            tenant,
            domainName,
            stage,
            connectedOn
        };
        await this.store(data);
        return data;
    }

    public async unregister(params: IWebsocketsConnectionRegistryUnregisterParams): Promise<void> {
        const { connectionId } = params;

        const keys = {
            PK,
            SK: connectionId
        };
        const original = await this.getViaConnection(connectionId);
        if (!original) {
            const message = `There is no connection with ID "${connectionId}".`;
            console.error(message);
            throw new WebinyError(message, "CONNECTION_NOT_FOUND", keys);
        }

        try {
            await this.entity.delete(keys);
        } catch (ex) {
            console.error(
                `Could not remove connection from the database: ${original.connectionId}`
            );
            throw new WebinyError(ex.message, ex.code, keys);
        }
    }

    private async getViaConnection(
        connectionId: string
    ): Promise<IWebsocketsConnectionRegistryData | null> {
        const item = await this.entity.get({
            PK,
            SK: connectionId
        });
        if (!item) {
            return null;
        }
        return item?.data || null;
    }

    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const reader = this.entity.createEntityReader({
            read: connections.map(id => {
                return {
                    PK,
                    SK: id
                };
            })
        });

        const results = await reader.execute();

        return results.map(item => {
            return item.data;
        });
    }

    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
        const items = await this.entity.queryAll({
            partitionKey: GSI1_PK,
            options: {
                index: "GSI1",
                eq: identity
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    public async listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]> {
        const options: Partial<EntityQueryOptions> = {
            beginsWith: `T#${tenant}`
        };

        const items = await this.entity.queryAll({
            partitionKey: GSI2_PK,
            options: {
                ...options,
                index: "GSI2"
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    public async listAll(): Promise<IWebsocketsConnectionRegistryData[]> {
        const items = await this.entity.queryAll({
            partitionKey: PK,
            options: {
                gte: " "
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    private async store(data: IWebsocketsConnectionRegistryData) {
        const { connectionId, tenant, identity } = data;
        const item = {
            PK,
            SK: connectionId,
            GSI1_PK,
            GSI1_SK: identity.id,
            GSI2_PK,
            GSI2_SK: `T#${tenant}`,
            GSI_TENANT: tenant,
            TYPE: "ws.connection",
            data
        };
        try {
            return await this.entity.put(item);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not store websockets connection data.",
                code: "STORE_WEBSOCKETS_CONNECTION_DATA_ERROR",
                data: item
            });
        }
    }
}
```

- [ ] **Step 4: Create index.ts — registration function**

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { ConnectionRegistry } from "@webiny/api-websockets";

interface RegisterWebsocketsDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerWebsocketsDdbStorageOperations = (
    params: RegisterWebsocketsDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const registry = new WebsocketsConnectionRegistry(params.documentClient);
        context.container.registerInstance(ConnectionRegistry, registry);
    });
};
```

- [ ] **Step 5: Run checklist and build**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
yarn build -p @webiny/api-websockets-ddb 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(api-websockets-ddb): create DDB storage package for websockets"
```

### Task 4: Create `api-websockets-sql` package

**Files:**
- Create: `packages/api-websockets-sql/package.json`
- Create: `packages/api-websockets-sql/src/index.ts`
- Create: `packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts`
- Create: `packages/api-websockets-sql/src/migrations/createWebsocketsConnectionsTable.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/api-websockets-sql",
  "version": "0.0.0",
  "type": "module",
  "keywords": [
    "@webiny/api-websockets",
    "storage-operations",
    "sql",
    "sau:sql"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git"
  },
  "description": "SQL storage operations for @webiny/api-websockets.",
  "author": "Webiny Ltd.",
  "license": "MIT",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "dependencies": {
    "@webiny/api-websockets": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/handler": "0.0.0",
    "knex": "^3.2.10"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "better-sqlite3": "^12.10.0",
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

- [ ] **Step 2: Create migration**

```ts
import type { Knex } from "knex";

const TABLE_NAME = "WebsocketsConnections";

export const createWebsocketsConnectionsTable = async (knex: Knex, tableNamePrefix?: string) => {
    const tableName = tableNamePrefix ? `${tableNamePrefix}${TABLE_NAME}` : TABLE_NAME;

    const exists = await knex.schema.hasTable(tableName);
    if (exists) {
        return;
    }

    await knex.schema.createTable(tableName, table => {
        table.text("connectionId").primary();
        table.text("identityId").notNullable();
        table.text("identityDisplayName").notNullable();
        table.text("identityType").notNullable();
        table.text("tenant").notNullable();
        table.text("domainName").notNullable();
        table.text("stage").notNullable();
        table.datetime("connectedOn").notNullable();

        table.index(["identityId"], `idx_${tableName}_identityId`);
        table.index(["tenant"], `idx_${tableName}_tenant`);
    });
};
```

- [ ] **Step 3: Create WebsocketsConnectionRegistry.ts**

```ts
import type { Knex } from "knex";
import WebinyError from "@webiny/error";
import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "@webiny/api-websockets";

const TABLE_NAME = "WebsocketsConnections";

interface WebsocketsConnectionRegistryParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export class WebsocketsConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly knex: Knex;
    private readonly tableName: string;

    public constructor(params: WebsocketsConnectionRegistryParams) {
        this.knex = params.knex;
        this.tableName = params.tableNamePrefix
            ? `${params.tableNamePrefix}${TABLE_NAME}`
            : TABLE_NAME;
    }

    public async register(
        params: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        const { connectionId, tenant, identity, domainName, stage, connectedOn } = params;

        const data: IWebsocketsConnectionRegistryData = {
            connectionId,
            identity,
            tenant,
            domainName,
            stage,
            connectedOn
        };

        await this.knex(this.tableName).insert({
            connectionId,
            identityId: identity.id,
            identityDisplayName: identity.displayName,
            identityType: identity.type,
            tenant,
            domainName,
            stage,
            connectedOn
        });

        return data;
    }

    public async unregister(params: IWebsocketsConnectionRegistryUnregisterParams): Promise<void> {
        const { connectionId } = params;

        const row = await this.knex(this.tableName).where({ connectionId }).first();
        if (!row) {
            const message = `There is no connection with ID "${connectionId}".`;
            console.error(message);
            throw new WebinyError(message, "CONNECTION_NOT_FOUND", { connectionId });
        }

        await this.knex(this.tableName).where({ connectionId }).delete();
    }

    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const rows = await this.knex(this.tableName).whereIn("connectionId", connections);
        return rows.map(row => this.toData(row));
    }

    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
        const rows = await this.knex(this.tableName).where({ identityId: identity });
        return rows.map(row => this.toData(row));
    }

    public async listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]> {
        const rows = await this.knex(this.tableName).where({ tenant });
        return rows.map(row => this.toData(row));
    }

    public async listAll(): Promise<IWebsocketsConnectionRegistryData[]> {
        const rows = await this.knex(this.tableName).select("*");
        return rows.map(row => this.toData(row));
    }

    private toData(row: Record<string, unknown>): IWebsocketsConnectionRegistryData {
        return {
            connectionId: row.connectionId as string,
            identity: {
                id: row.identityId as string,
                displayName: row.identityDisplayName as string,
                type: row.identityType as string
            },
            tenant: row.tenant as string,
            domainName: row.domainName as string,
            stage: row.stage as string,
            connectedOn: row.connectedOn as string
        };
    }
}
```

- [ ] **Step 4: Create index.ts — registration function**

```ts
import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
import { ConnectionRegistry } from "@webiny/api-websockets";
import { createWebsocketsConnectionsTable } from "./migrations/createWebsocketsConnectionsTable.js";

interface RegisterWebsocketsSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const registerWebsocketsSqlStorageOperations = (
    params: RegisterWebsocketsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(async () => {
        await createWebsocketsConnectionsTable(params.knex, params.tableNamePrefix);
    }, context => {
        const registry = new WebsocketsConnectionRegistry({
            knex: params.knex,
            tableNamePrefix: params.tableNamePrefix
        });
        context.container.registerInstance(ConnectionRegistry, registry);
    });
};
```

- [ ] **Step 5: Run checklist and build**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
yarn build -p @webiny/api-websockets-sql 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(api-websockets-sql): create SQL storage package for websockets"
```

### Task 5: Update project templates

**Files:**
- Modify: `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`

- [ ] **Step 1: Update DDB template**

In `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`:
- Add import: `import { registerWebsocketsDdbStorageOperations } from "@webiny/api-websockets-ddb";`
- After `createWebsockets()`, add: `registerWebsocketsDdbStorageOperations({ documentClient }),`

- [ ] **Step 2: Update OpenSearch template**

In `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`:
- Add import: `import { registerWebsocketsDdbStorageOperations } from "@webiny/api-websockets-ddb";`
- After `createWebsockets()`, add: `registerWebsocketsDdbStorageOperations({ documentClient }),`

- [ ] **Step 3: Update SQLite template**

In `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`:
- Add import: `import { registerWebsocketsSqlStorageOperations } from "@webiny/api-websockets-sql";`
- After `createWebsockets()`, add: `registerWebsocketsSqlStorageOperations({ knex }),`

- [ ] **Step 4: Add new packages to project-aws-template dependencies**

Add `@webiny/api-websockets-ddb` and `@webiny/api-websockets-sql` to `packages/project-aws-template/package.json` dependencies.

- [ ] **Step 5: Run checklist and build**

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

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: wire websockets storage packages into project templates"
```

### Task 6: Move DDB registry test to api-websockets-ddb

**Files:**
- Move: `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts` → `packages/api-websockets-ddb/__tests__/websocketsConnectionRegistry.test.ts`

- [ ] **Step 1: Move test file and update imports**

Copy `packages/api-websockets/__tests__/registry/websocketsConnectionRegistry.test.ts` to `packages/api-websockets-ddb/__tests__/` and update imports:

```ts
import { describe, it, expect } from "vitest";
import { WebsocketsConnectionRegistry } from "../src/WebsocketsConnectionRegistry";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
```

Delete the original file. If the `packages/api-websockets/__tests__/registry/` directory is now empty, delete it.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "test: move DDB registry test to api-websockets-ddb"
```

### Task 7: Update test helpers in base package

**Files:**
- Modify: `packages/api-websockets/__tests__/helpers/plugins.ts`

- [ ] **Step 1: Check if test helpers still work**

The test helpers in `packages/api-websockets/__tests__/helpers/plugins.ts` call `createWebsockets()` which no longer hardcodes the DDB registry. Tests that need a registry will need a storage package registered. Check if the tests use `getStorageOps` to wire storage — if so, it should be handled by the test environment. If not, the test setup may need `registerWebsocketsDdbStorageOperations` added.

- [ ] **Step 2: Run base package tests**

```bash
yarn test packages/api-websockets 2>&1 | tail -50
```

Fix any failures related to the missing registry implementation by adding DDB registration to the test setup.

- [ ] **Step 3: Commit if changes were needed**

```bash
git add .
git commit -m "fix(api-websockets): update test setup for DI-based registry"
```
