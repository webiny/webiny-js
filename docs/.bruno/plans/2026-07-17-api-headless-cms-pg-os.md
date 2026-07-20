# api-headless-cms-pg-os Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@webiny/api-headless-cms-pg-os` — CMS storage using PostgreSQL for primary storage (writes + point reads) and OpenSearch for list/search, with dual-write to a PG sync table for WAL-based OS synchronization.

**Architecture:** Wraps `@webiny/api-headless-cms-sql` for all PG operations and `@webiny/api-headless-cms-utils-os` for all OpenSearch query infrastructure. Each write operation delegates to SQL then appends a compressed OS-ready document to a PG sync table. The sync table is consumed by `@webiny/api-sync-pg-to-opensearch` which pushes documents to OpenSearch. Point reads hit PG directly; list/search/aggregation queries hit OpenSearch.

**Tech Stack:** TypeScript, knex (PG), OpenSearch, `@webiny/feature` DI, vitest, PGlite (tests)

## Global Constraints

- All internal package versions use `"0.0.0"`
- Zero AWS dependencies
- Follow existing DI patterns: `createAbstraction` + `createImplementation` + `createFeature`
- Package uses ESM (`"type": "module"`) with `"./*": "./*"` exports
- SyncTableManager follows EntryTableManager pattern (lazy creation, `reset()` for tests, registered on `globalThis.__sqlTableManagers`)
- Compression uses `CompressionHandler` from `@webiny/utils` — self-describing `{compression, value}` format
- OS record IDs use `"{entryId}:L"` (latest) and `"{entryId}:P"` (published) suffixes
- OS documents include `TYPE`/`__type` markers via `createLatestRecordType()`/`createPublishedRecordType()` from utils-os
- `OperationType.INSERT` and `OperationType.MODIFY` are identical in the sync adapter (both upsert) — use INSERT for creates, MODIFY for updates

---

### Task 1: Package scaffolding + SyncTableManager

Create the package skeleton, types, and the SyncTableManager feature that lazily creates the `cms_os_sync` table.

**Files:**
- Create: `packages/api-headless-cms-pg-os/package.json`
- Create: `packages/api-headless-cms-pg-os/tsconfig.json`
- Create: `packages/api-headless-cms-pg-os/tsconfig.build.json`
- Create: `packages/api-headless-cms-pg-os/ci.config.json`
- Create: `packages/api-headless-cms-pg-os/vitest.config.ts`
- Create: `packages/api-headless-cms-pg-os/src/types.ts`
- Create: `packages/api-headless-cms-pg-os/src/features/syncTableManager/abstractions.ts`
- Create: `packages/api-headless-cms-pg-os/src/features/syncTableManager/SyncTableManager.ts`
- Create: `packages/api-headless-cms-pg-os/src/features/syncTableManager/feature.ts`
- Create: `packages/api-headless-cms-pg-os/src/index.ts` (placeholder barrel)
- Test: `packages/api-headless-cms-pg-os/__tests__/syncTableManager.test.ts`

**Interfaces:**
- Consumes: `KnexClient` from `@webiny/api-core-sql`, `TableNameResolver` from `@webiny/api-headless-cms-sql`
- Produces: `SyncTableManager` abstraction with `ensureTable(): Promise<void>`, `getTableName(): string`, `reset(): void`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/api-headless-cms-pg-os",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "keywords": [
    "@webiny/api-headless-cms",
    "storage-operations",
    "postgresql",
    "opensearch",
    "cms:pg-os"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-headless-cms-pg-os"
  },
  "description": "PostgreSQL + OpenSearch storage operations for Headless CMS API.",
  "license": "MIT",
  "author": "Webiny Ltd.",
  "dependencies": {
    "@webiny/api-core-sql": "0.0.0",
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-headless-cms-sql": "0.0.0",
    "@webiny/api-headless-cms-storage": "0.0.0",
    "@webiny/api-headless-cms-utils-os": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/db-utils": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0",
    "knex": "^3.3.0"
  },
  "devDependencies": {
    "@electric-sql/pglite": "^0.5.4",
    "@electric-sql/pglite-socket": "^0.2.7",
    "@webiny/api-sync-pg-to-opensearch": "0.0.0",
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "typescript": "^7.0.2",
    "vitest": "^4.1.10"
  },
  "publishConfig": {
    "access": "public"
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Model after `packages/api-headless-cms-sql/tsconfig.json`. Run:

```bash
node scripts/generateTsConfigsInPackages.js
```

This auto-generates tsconfig files based on package.json dependencies. If it doesn't produce one, create manually:

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "references": []
}
```

Also create `tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["__tests__/**/*"]
}
```

- [ ] **Step 3: Create ci.config.json**

```json
{
  "$schema": "../../.github/workflows/ci.config.schema.json",
  "vitest": {
    "storageOps": ["pg-os,ddb"]
  }
}
```

- [ ] **Step 4: Create vitest.config.ts**

Model after `packages/api-headless-cms-sql/vitest.config.ts`. Check that file first, then create one following the same pattern.

- [ ] **Step 5: Create types.ts**

```typescript
// packages/api-headless-cms-pg-os/src/types.ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

export type { CmsContext };

export interface ISyncRow {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: string;
    tenant: string;
}
```

- [ ] **Step 6: Create SyncTableManager abstraction**

```typescript
// packages/api-headless-cms-pg-os/src/features/syncTableManager/abstractions.ts
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ISyncTableManager {
    ensureTable(): Promise<void>;
    getTableName(): string;
    reset(): void;
}

export const SyncTableManager = createAbstraction<ISyncTableManager>("Cms/PgOs/SyncTableManager");

export namespace SyncTableManager {
    export type Interface = ISyncTableManager;
}
```

- [ ] **Step 7: Create SyncTableManager implementation**

```typescript
// packages/api-headless-cms-pg-os/src/features/syncTableManager/SyncTableManager.ts
import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager as SyncTableManagerAbstraction } from "./abstractions.js";
import { TableNameResolver } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";

class SyncTableManagerImpl implements SyncTableManagerAbstraction.Interface {
    private readonly knex;
    private readonly tableName;
    private initialized = false;
    private initPromise?: Promise<void>;

    constructor(knex: KnexClient.Interface, tableNameResolver: TableNameResolver.Interface) {
        this.knex = knex;
        this.tableName = tableNameResolver.resolve("cms_os_sync");

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as SyncTableManagerAbstraction.Interface[];
        managers.push(this);
    }

    public reset(): void {
        this.initialized = false;
        this.initPromise = undefined;
    }

    public async ensureTable(): Promise<void> {
        if (this.initialized) {
            return;
        }
        if (!this.initPromise) {
            this.initPromise = this.doEnsureTable().catch(err => {
                this.initPromise = undefined;
                throw err;
            });
        }
        return this.initPromise;
    }

    public getTableName(): string {
        return this.tableName;
    }

    private async doEnsureTable(): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(this.tableName);

        if (!exists) {
            await this.createTable();
        }

        this.initialized = true;
    }

    private async createTable(): Promise<void> {
        try {
            await this.knex.client.schema.createTable(this.tableName, table => {
                table.text("id").primary();
                table.text("entryId").notNullable();
                table.text("index").notNullable();
                table.text("operation").notNullable();
                table.text("data").notNullable();
                table.text("tenant").notNullable();

                table.index(["tenant"]);
            });
        } catch (err) {
            if (await this.knex.client.schema.hasTable(this.tableName)) {
                return;
            }
            throw err;
        }
    }
}

export const SyncTableManager = SyncTableManagerAbstraction.createImplementation({
    implementation: SyncTableManagerImpl,
    dependencies: [KnexClient, TableNameResolver]
});
```

- [ ] **Step 8: Create SyncTableManager feature**

```typescript
// packages/api-headless-cms-pg-os/src/features/syncTableManager/feature.ts
import { createFeature } from "@webiny/feature/api/index.js";
import { SyncTableManager } from "./SyncTableManager.js";

export const SyncTableManagerFeature = createFeature({
    name: "cms.pgOs.syncTableManager",
    register: container => {
        container.register(SyncTableManager);
    }
});
```

- [ ] **Step 9: Create placeholder barrel export**

```typescript
// packages/api-headless-cms-pg-os/src/index.ts
export { SyncTableManager } from "./features/syncTableManager/abstractions.js";
```

- [ ] **Step 10: Write SyncTableManager test**

```typescript
// packages/api-headless-cms-pg-os/__tests__/syncTableManager.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolver, TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { SyncTableManagerFeature } from "../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../src/features/syncTableManager/abstractions.js";

describe("SyncTableManager", () => {
    let knex: ReturnType<typeof knexLib>;
    let db: InstanceType<typeof PGlite>;
    let server: InstanceType<typeof PGLiteSocketServer>;

    beforeEach(async () => {
        db = await PGlite.create();
        server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
        await server.start();

        knex = knexLib({
            client: "pg",
            connection: {
                host: "127.0.0.1",
                port: server.port,
                database: "postgres"
            },
            pool: { min: 1, max: 1 }
        });

        return async () => {
            await knex.destroy();
            await server.stop();
            await db.close();
        };
    });

    it("should create sync table on first ensureTable call", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });

    it("should be idempotent on repeated ensureTable calls", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });

    it("should re-create table after reset", async () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        SyncTableManagerFeature.register(container);

        const manager = container.resolve(SyncTableManager);
        await manager.ensureTable();

        await knex.schema.dropTable(manager.getTableName());
        manager.reset();
        await manager.ensureTable();

        const exists = await knex.schema.hasTable(manager.getTableName());
        expect(exists).toBe(true);
    });
});
```

- [ ] **Step 11: Run tests**

```bash
yarn vitest run packages/api-headless-cms-pg-os/__tests__/syncTableManager.test.ts 2>&1 | tail -30
```

Expected: 3 tests pass.

- [ ] **Step 12: Commit**

```bash
git add packages/api-headless-cms-pg-os/
git commit -m "feat(api-headless-cms-pg-os): scaffold package with SyncTableManager"
```

---

### Task 2: Sync writer — prepare OS documents and write to sync table

Build the function that transforms a CMS entry into a compressed OS-ready document and writes it to the PG sync table. This is the core of the dual-write pattern.

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/syncWriter.ts`
- Test: `packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts`

**Interfaces:**
- Consumes: `SyncTableManager` (Task 1), `transformEntryToIndex` from `utils-os`, `CompressionHandler` from `@webiny/utils`, `CmsEntryOpenSearchFieldIndexRegistry` from `utils-os`, `configurations` from `utils-os`
- Produces: `SyncWriter` with methods: `writeLatest(params)`, `writePublished(params)`, `removeLatest(params)`, `removePublished(params)`

- [ ] **Step 1: Create sync writer**

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/syncWriter.ts
import type { CmsEntry, CmsEntryValues, CmsStorageEntry, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Knex } from "knex";
import { transformEntryToIndex } from "@webiny/api-headless-cms-utils-os/operations/entry/transformations/transformEntryToIndex.js";
import { createLatestRecordType, createPublishedRecordType } from "@webiny/api-headless-cms-utils-os/operations/entry/recordType.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import type { ISyncRow } from "~/types.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";

interface SyncWriterParams {
    knex: Knex;
    syncTableManager: SyncTableManager.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
}

interface WriteEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

interface RemoveEntryParams {
    model: Pick<StorageOperationsCmsModel, "tenant" | "modelId">;
    entryId: string;
}

export interface SyncWriter {
    writeLatest<T extends CmsEntryValues = CmsEntryValues>(params: WriteEntryParams<T>): Promise<void>;
    writePublished<T extends CmsEntryValues = CmsEntryValues>(params: WriteEntryParams<T>): Promise<void>;
    removeLatest(params: RemoveEntryParams): Promise<void>;
    removePublished(params: RemoveEntryParams): Promise<void>;
}

export const createSyncWriter = (params: SyncWriterParams): SyncWriter => {
    const { knex, syncTableManager, fieldIndexRegistry, compressionHandler } = params;

    const query = (): Knex.QueryBuilder<ISyncRow> => {
        return knex<ISyncRow>(syncTableManager.getTableName());
    };

    const writeRecord = async <T extends CmsEntryValues>(
        writeParams: WriteEntryParams<T>,
        recordType: "latest" | "published"
    ): Promise<void> => {
        const { model, entry, storageEntry } = writeParams;

        const indexEntry = transformEntryToIndex({
            model,
            entry,
            storageEntry,
            fieldIndexRegistry
        });

        const isLatest = recordType === "latest";
        const recordTypeValue = isLatest ? createLatestRecordType() : createPublishedRecordType();

        const document = {
            ...indexEntry,
            ...(isLatest ? { latest: true } : { published: true }),
            TYPE: recordTypeValue,
            __type: recordTypeValue
        };

        const compressed = await compressionHandler.compress(document);
        const { index } = configurations.es({ model });
        const id = `${entry.entryId}:${isLatest ? "L" : "P"}`;

        const row: ISyncRow = {
            id,
            entryId: entry.entryId,
            index,
            operation: OperationType.MODIFY,
            data: JSON.stringify(compressed),
            tenant: entry.tenant
        };

        await query().insert(row).onConflict("id").merge();
    };

    const removeRecord = async (removeParams: RemoveEntryParams, suffix: "L" | "P"): Promise<void> => {
        const { model, entryId } = removeParams;
        const { index } = configurations.es({ model });
        const id = `${entryId}:${suffix}`;

        const row: ISyncRow = {
            id,
            entryId,
            index,
            operation: OperationType.REMOVE,
            data: JSON.stringify({}),
            tenant: model.tenant
        };

        await query().insert(row).onConflict("id").merge();
    };

    return {
        async writeLatest(writeParams) {
            await writeRecord(writeParams, "latest");
        },
        async writePublished(writeParams) {
            await writeRecord(writeParams, "published");
        },
        async removeLatest(removeParams) {
            await removeRecord(removeParams, "L");
        },
        async removePublished(removeParams) {
            await removeRecord(removeParams, "P");
        }
    };
};
```

- [ ] **Step 2: Write sync writer test**

```typescript
// packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CmsEntryOpenSearchFieldIndexFeature, CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { SyncTableManagerFeature } from "../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../src/features/syncTableManager/abstractions.js";
import { createSyncWriter } from "../src/operations/entry/syncWriter.js";
import type { ISyncRow } from "../src/types.js";

const createModel = (overrides = {}) => ({
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    name: "Test Model",
    fields: [],
    layout: [],
    group: { id: "group1", name: "Group 1", slug: "group-1" },
    convertValueKeyToStorage: ({ values }: any) => values,
    convertValueKeyFromStorage: ({ values }: any) => values,
    ...overrides
});

const createEntry = (overrides = {}) => ({
    id: "entry1#0001",
    entryId: "entry1",
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    version: 1,
    status: "draft",
    locked: false,
    isLatest: true,
    isPublished: false,
    values: { title: "Test Entry" },
    ...overrides
});

describe("SyncWriter", () => {
    let knex: ReturnType<typeof knexLib>;
    let db: InstanceType<typeof PGlite>;
    let server: InstanceType<typeof PGLiteSocketServer>;

    beforeEach(async () => {
        db = await PGlite.create();
        server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
        await server.start();

        knex = knexLib({
            client: "pg",
            connection: { host: "127.0.0.1", port: server.port, database: "postgres" },
            pool: { min: 1, max: 1 }
        });

        return async () => {
            await knex.destroy();
            await server.stop();
            await db.close();
        };
    });

    const setup = () => {
        const container = new Container();
        container.registerInstance(KnexClient, { client: knex });
        container.registerInstance(TableNameResolverConfig, { sharedTables: false });
        TableNameResolverFeature.register(container);
        CompressionFeature.register(container);
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        SyncTableManagerFeature.register(container);

        const syncTableManager = container.resolve(SyncTableManager);
        const compressionHandler = container.resolve(CompressionHandler);
        const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);

        return {
            syncTableManager,
            syncWriter: createSyncWriter({
                knex,
                syncTableManager,
                fieldIndexRegistry,
                compressionHandler
            })
        };
    };

    it("should write a latest sync record", async () => {
        const { syncTableManager, syncWriter } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await syncWriter.writeLatest({ model, entry, storageEntry: entry });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:L");
        expect(rows[0].entryId).toBe("entry1");
        expect(rows[0].operation).toBe("MODIFY");
        expect(rows[0].tenant).toBe("root");

        const data = JSON.parse(rows[0].data);
        expect(data.compression).toBe("gzip");
        expect(typeof data.value).toBe("string");
    });

    it("should write a published sync record", async () => {
        const { syncTableManager, syncWriter } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry({ status: "published" }) as any;

        await syncWriter.writePublished({ model, entry, storageEntry: entry });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:P");
    });

    it("should write a REMOVE record", async () => {
        const { syncTableManager, syncWriter } = setup();
        await syncTableManager.ensureTable();

        await syncWriter.removeLatest({ model: { tenant: "root", modelId: "testModel" }, entryId: "entry1" });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("entry1:L");
        expect(rows[0].operation).toBe("REMOVE");
    });

    it("should upsert on conflict (same id)", async () => {
        const { syncTableManager, syncWriter } = setup();
        await syncTableManager.ensureTable();

        const model = createModel() as any;
        const entry = createEntry() as any;

        await syncWriter.writeLatest({ model, entry, storageEntry: entry });
        await syncWriter.writeLatest({ model, entry: { ...entry, values: { title: "Updated" } }, storageEntry: { ...entry, values: { title: "Updated" } } });

        const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
        expect(rows).toHaveLength(1);
    });
});
```

- [ ] **Step 3: Run tests**

```bash
yarn vitest run packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts 2>&1 | tail -30
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-pg-os/
git commit -m "feat(api-headless-cms-pg-os): add sync writer for OS document dual-write"
```

---

### Task 3: Entry write operations — delegate to SQL + sync table writes

Build the write path that delegates each CMS entry mutation to the SQL package's operations, then writes the appropriate sync table records.

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/index.ts`

**Interfaces:**
- Consumes: `SyncWriter` (Task 2), `createEntriesStorageOperations` from `@webiny/api-headless-cms-sql`, all SQL + OS DI dependencies
- Produces: `createEntriesStorageOperations(params): CmsEntryStorageOperations` — full entry storage operations with PG writes + OS list

- [ ] **Step 1: Create entry operations factory**

This is the central file. It creates SQL entry ops, wraps each write method to add sync table writes, and replaces list/get with OS queries. The implementation is large but each method follows the same pattern.

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/index.ts
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Knex } from "knex";
import type { Container } from "@webiny/feature/api";
import type { PluginsContainer } from "@webiny/plugins";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import { createElasticsearchBody } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/body.js";
import { extractEntriesFromIndex } from "@webiny/api-headless-cms-utils-os/helpers/entryIndexHelpers.js";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { decodeCursor, encodeCursor, createLimit } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { createSyncWriter, type SyncWriter } from "./syncWriter.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import type { CmsEntryOpenSearchFilterRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
import type { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
import type { CmsEntryOpenSearchQueryModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchQueryModifier/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
import type { CmsEntryOpenSearchFullTextSearch } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFullTextSearch/index.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { OpenSearchQueryBuilderOperatorRegistry, OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    plugins: PluginsContainer;
    elasticsearch: OpenSearchClient;
    entryTableManager: EntryTableManager.Interface;
    syncTableManager: SyncTableManager.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
    bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[];
    sortModifiers: CmsEntryOpenSearchSortModifier.Interface[];
    queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[];
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[];
    operatorRegistry: OpenSearchQueryBuilderOperatorRegistry.Interface;
    fieldFactory: OpenSearchFieldFactory.Interface;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const {
        knex,
        container,
        plugins,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        filterRegistry,
        compressionHandler,
        bodyModifiers,
        sortModifiers,
        queryModifiers,
        valueSearchRegistry,
        fullTextSearches,
        operatorRegistry,
        fieldFactory
    } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex,
        entryTableManager,
        container,
        plugins
    });

    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const syncWriter = createSyncWriter({
        knex,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    const ensureTables = async () => {
        await entryTableManager.ensureTable();
        await syncTableManager.ensureTable();
    };

    const writeSyncForEntry = async <T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ) => {
        await syncWriter.writeLatest({ model, entry, storageEntry });
        if (entry.status === "published") {
            await syncWriter.writePublished({ model, entry, storageEntry });
        }
    };

    // --- WRITE OPERATIONS ---

    const create = async <T extends CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>> => {
        await ensureTables();
        const result = await sqlOps.create(initialModel, params);
        const model = getStorageOperationsModel<T>(initialModel);
        await writeSyncForEntry(model, params.entry as CmsEntry<T>, params.storageEntry as CmsStorageEntry<T>);
        return result;
    };

    const createRevisionFrom: CmsEntryStorageOperations["createRevisionFrom"] = async (initialModel, params) => {
        await ensureTables();
        const result = await sqlOps.createRevisionFrom(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({ model, entry: params.entry, storageEntry: params.storageEntry });
        return result;
    };

    const update: CmsEntryStorageOperations["update"] = async (initialModel, params) => {
        await ensureTables();
        const result = await sqlOps.update(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({ model, entry: params.entry, storageEntry: params.storageEntry });
        return result;
    };

    const publish: CmsEntryStorageOperations["publish"] = async (initialModel, params) => {
        await ensureTables();
        const result = await sqlOps.publish(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({ model, entry: params.entry, storageEntry: params.storageEntry });
        await syncWriter.writePublished({ model, entry: params.entry, storageEntry: params.storageEntry });
        return result;
    };

    const unpublish: CmsEntryStorageOperations["unpublish"] = async (initialModel, params) => {
        await ensureTables();
        const result = await sqlOps.unpublish(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({ model, entry: params.entry, storageEntry: params.storageEntry });
        await syncWriter.removePublished({ model, entryId: params.entry.entryId });
        return result;
    };

    const move: CmsEntryStorageOperations["move"] = async (initialModel, id, folderId) => {
        await ensureTables();
        await sqlOps.move(initialModel, id, folderId);
        // After move, re-sync latest and published from PG.
        // The move operation patches all revisions but we only need to update the OS records.
        // We need to read the latest and published entries from PG to get the updated data.
        const model = getStorageOperationsModel(initialModel);
        const latest = await sqlOps.getLatestRevisionByEntryId(initialModel, { id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }
        const published = await sqlOps.getPublishedRevisionByEntryId(initialModel, { id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        }
    };

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (initialModel, params) => {
        await ensureTables();
        await sqlOps.moveToBin(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        // After moveToBin, re-read latest/published from PG (they have wbyDeleted=true now).
        const latest = await sqlOps.getLatestRevisionByEntryId(initialModel, { id: params.entry.id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }
        const published = await sqlOps.getPublishedRevisionByEntryId(initialModel, { id: params.entry.id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        }
    };

    const restoreFromBin: CmsEntryStorageOperations["restoreFromBin"] = async (initialModel, params) => {
        await ensureTables();
        const result = await sqlOps.restoreFromBin(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        const latest = await sqlOps.getLatestRevisionByEntryId(initialModel, { id: params.entry.id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }
        const published = await sqlOps.getPublishedRevisionByEntryId(initialModel, { id: params.entry.id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        }
        return result;
    };

    const deleteEntry: CmsEntryStorageOperations["delete"] = async (initialModel, params) => {
        await ensureTables();
        const model = getStorageOperationsModel(initialModel);
        const entryId = params.entry.entryId;
        await sqlOps.delete(initialModel, params);
        await syncWriter.removeLatest({ model, entryId });
        await syncWriter.removePublished({ model, entryId });
    };

    const deleteRevision: CmsEntryStorageOperations["deleteRevision"] = async (initialModel, params) => {
        await ensureTables();
        await sqlOps.deleteRevision(initialModel, params);
        const model = getStorageOperationsModel(initialModel);
        // After deleting a revision, re-sync the latest record (might have been promoted).
        if (params.latestStorageEntry) {
            await syncWriter.writeLatest({
                model,
                entry: params.latestStorageEntry,
                storageEntry: params.latestStorageEntry
            });
        }
        // If deleted revision was published, remove published record.
        if (params.storageEntry.status === "published") {
            await syncWriter.removePublished({ model, entryId: params.storageEntry.entryId });
        }
    };

    const deleteMultipleEntries: CmsEntryStorageOperations["deleteMultipleEntries"] = async (initialModel, params) => {
        await ensureTables();
        const model = getStorageOperationsModel(initialModel);
        await sqlOps.deleteMultipleEntries(initialModel, params);
        for (const entry of params.entries) {
            const entryId = typeof entry === "string" ? entry.split("#")[0] : entry.entryId;
            await syncWriter.removeLatest({ model, entryId });
            await syncWriter.removePublished({ model, entryId });
        }
    };

    // --- LIST / SEARCH OPERATIONS (OpenSearch) ---

    const list = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);
        const limit = createLimit(params.limit, 50);

        const { index } = configurations.es({ model });

        const body = createElasticsearchBody({
            model,
            fieldRegistry,
            fieldIndexRegistry,
            bodyModifiers,
            sortModifiers,
            queryModifiers,
            valueSearchRegistry,
            fullTextSearches,
            filterRegistry,
            fieldFactory,
            params: {
                ...params,
                limit,
                after: decodeCursor(params.after)
            },
            operatorRegistry
        });

        let response: any;
        try {
            response = await elasticsearch.search({ index, body });
        } catch (error: any) {
            if (shouldIgnoreEsResponseError(error)) {
                return { hasMoreItems: false, totalCount: 0, cursor: null, items: [] };
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error, index, body, model
            });
        }

        const { hits, total } = response.body.hits;

        const items = extractEntriesFromIndex<T>({
            fieldRegistry,
            fieldIndexRegistry,
            model,
            entries: hits.map((item: any) => item._source as CmsIndexEntry<T>)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            items.pop();
        }

        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;
        const totalCount = typeof total === "number" ? total : total?.value ?? 0;

        return { hasMoreItems, totalCount, cursor, items };
    };

    const get: CmsEntryStorageOperations["get"] = async (initialModel, params) => {
        const { items } = await list(initialModel, { ...params, limit: 1 });
        return items.shift() || null;
    };

    const getUniqueFieldValues: CmsEntryStorageOperations["getUniqueFieldValues"] = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) => {
        const { where, fieldId } = params;
        const { index } = configurations.es({ model });

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            return [];
        }

        const initialBody = createElasticsearchBody({
            model,
            fieldRegistry,
            fieldIndexRegistry,
            bodyModifiers,
            sortModifiers,
            queryModifiers,
            valueSearchRegistry,
            fullTextSearches,
            filterRegistry,
            fieldFactory,
            params: { limit: 1, where },
            operatorRegistry
        });

        const body = {
            ...initialBody,
            size: 0,
            aggregations: {
                getUniqueFieldValues: {
                    terms: {
                        field: `values.${field.storageId}.keyword`,
                        size: 1000000
                    }
                }
            }
        };

        let response: any;
        try {
            response = await elasticsearch.search({ index, body });
        } catch (error: any) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error, index, model, body
            });
        }

        const aggregations = response.body.aggregations || {};
        const agg = aggregations["getUniqueFieldValues"];
        const buckets = agg && "buckets" in agg && Array.isArray(agg.buckets) ? agg.buckets : [];
        return buckets.map((bucket: { key: string; doc_count: number }) => ({
            value: bucket.key,
            count: bucket.doc_count
        }));
    };

    // --- RETURN ALL OPERATIONS ---

    return {
        create,
        createRevisionFrom,
        update,
        move,
        delete: deleteEntry,
        moveToBin,
        restoreFromBin,
        deleteRevision,
        deleteMultipleEntries,
        publish,
        unpublish,
        get,
        list,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision,
        getUniqueFieldValues
    };
};
```

- [ ] **Step 2: Verify build compiles**

```bash
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -20
```

Expected: Build succeeds (or at least no type errors in this file).

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/
git commit -m "feat(api-headless-cms-pg-os): add entry operations with SQL delegation + OS list"
```

---

### Task 4: Composite feature, factory, and registration

Wire everything together: model/group passthrough to SQL, the composite feature that registers all DI dependencies, and the public registration function.

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/operations/model/index.ts`
- Create: `packages/api-headless-cms-pg-os/src/operations/group/index.ts`
- Create: `packages/api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts`
- Modify: `packages/api-headless-cms-pg-os/src/index.ts`

**Interfaces:**
- Consumes: All features from sql, utils-os, opensearch; entry ops (Task 3)
- Produces: `registerPgOsStorageOperations(config): Plugin[]` — registration function, `HeadlessCmsPgOsFeature` — composite feature

- [ ] **Step 1: Create model/group passthroughs**

```typescript
// packages/api-headless-cms-pg-os/src/operations/model/index.ts
export { createModelsStorageOperations } from "@webiny/api-headless-cms-sql/operations/model/index.js";
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/group/index.ts
export { createGroupsStorageOperations } from "@webiny/api-headless-cms-sql/operations/group/index.js";
```

- [ ] **Step 2: Create composite feature and factory**

```typescript
// packages/api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts
import type { CmsContext } from "~/types.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KnexClient } from "@webiny/api-core-sql";
import {
    CmsEntryOpenSearchFieldIndexFeature,
    CmsEntryOpenSearchFieldIndexRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import {
    CmsEntryOpenSearchFilterFeature,
    CmsEntryOpenSearchFilterRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
import {
    CmsEntryOpenSearchIndexFeature
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
import {
    CmsEntryOpenSearchValueSearchFeature,
    CmsEntryOpenSearchValueSearchRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
import { CmsEntryOpenSearchQueryModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchQueryModifier/index.js";
import { CmsEntryOpenSearchFullTextSearch } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFullTextSearch/index.js";
import { createElasticsearchIndex } from "@webiny/api-headless-cms-utils-os/elasticsearch/createElasticsearchIndex.js";
import { deleteElasticsearchIndex } from "@webiny/api-headless-cms-utils-os/elasticsearch/deleteElasticsearchIndex.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import {
    OpenSearchClient,
    OpenSearchFieldFactory,
    OpenSearchQueryBuilderOperatorRegistry
} from "@webiny/api-opensearch/exports/api/opensearch.js";
import { TableNameResolver, TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "@webiny/api-headless-cms-sql/features/entryTableManager/feature.js";
import { GroupSchemaManager } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/abstractions.js";
import { ModelSchemaManager } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/abstractions.js";
import { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import { SyncTableManagerFeature } from "./syncTableManager/feature.js";
import { SyncTableManager } from "./syncTableManager/abstractions.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import {
    createFilterCreatePlugins,
    createPlainObjectPathPlugin,
    createLocationFolderIdPathPlugin,
    createDatetimeTransformValuePlugin
} from "@webiny/api-headless-cms-storage";

interface PgOsStorageOperationsFactoryParams {
    elasticsearch: ReturnType<OpenSearchClient.Interface["use"]>;
    plugins: any;
    container: CmsContext["container"];
}

const createPgOsStorageOperations = (params: PgOsStorageOperationsFactoryParams): HeadlessCmsStorageOperations => {
    const { elasticsearch, container, plugins } = params;

    const knex = container.resolve(KnexClient);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entryTableManager = container.resolve(EntryTableManager);
    const syncTableManager = container.resolve(SyncTableManager);

    const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);
    const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
    const compressionHandler = container.resolve(CompressionHandler);
    const bodyModifiers = container.resolveAll(CmsEntryOpenSearchBodyModifier);
    const sortModifiers = container.resolveAll(CmsEntryOpenSearchSortModifier);
    const queryModifiers = container.resolveAll(CmsEntryOpenSearchQueryModifier);
    const valueSearchRegistry = container.resolve(CmsEntryOpenSearchValueSearchRegistry);
    const fullTextSearches = container.resolveAll(CmsEntryOpenSearchFullTextSearch);
    const filterRegistry = container.resolve(CmsEntryOpenSearchFilterRegistry);
    const operatorRegistry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const fieldFactory = container.resolve(OpenSearchFieldFactory);

    plugins.register([
        createFilterCreatePlugins(),
        createPlainObjectPathPlugin(),
        createLocationFolderIdPathPlugin(),
        createDatetimeTransformValuePlugin()
    ]);

    container.registerFactory(ModelAfterCreateEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await createElasticsearchIndex({
                client: elasticsearch,
                model,
                indexConfigs: container.resolveAll(CmsEntryOpenSearchIndex)
            });
        }
    }));

    container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await createElasticsearchIndex({
                client: elasticsearch,
                model,
                indexConfigs: container.resolveAll(CmsEntryOpenSearchIndex)
            });
        }
    }));

    container.registerFactory(ModelAfterDeleteEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await deleteElasticsearchIndex({
                client: elasticsearch,
                model
            });
        }
    }));

    const groups = createGroupsStorageOperations(knex.client, tableNameResolver, groupSchemaManager);
    const models = createModelsStorageOperations(knex.client, tableNameResolver, modelSchemaManager);
    const entries = createEntriesStorageOperations({
        knex: knex.client,
        container,
        plugins,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        filterRegistry,
        compressionHandler,
        bodyModifiers,
        sortModifiers,
        queryModifiers,
        valueSearchRegistry,
        fullTextSearches,
        operatorRegistry,
        fieldFactory
    });

    return {
        name: "postgresql:opensearch",
        beforeInit: () => {},
        groups,
        models,
        entries
    };
};

class PgOsStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public create(context: CmsContext) {
        return createPgOsStorageOperations({
            elasticsearch: this.openSearchClient.use(),
            plugins: context.plugins,
            container: context.container
        });
    }
}

const PgOsStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation({
    implementation: PgOsStorageOperationsFactoryImpl,
    dependencies: [OpenSearchClient]
});

export interface IPgOsStorageOperationsConfig {
    knex: any;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const HeadlessCmsPgOsFeature = createFeature({
    name: "cms.storageOperations.pgOs",
    register: container => {
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);
        container.register(PgOsStorageOperationsFactory).inSingletonScope();
    }
});

export const registerPgOsStorageOperations = (config: IPgOsStorageOperationsConfig) => {
    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.pgOs.registration",
        register: container => {
            const sharedTables = process.env.WEBINY_SHARED_TABLES === "true";

            container.registerInstance(TableNameResolverConfig, {
                sharedTables,
                tableNamePrefix: config.tableNamePrefix,
                tableNameSuffix: config.tableNameSuffix
            });

            TableNameResolverFeature.register(container);
            ValueFilterFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntryTableManagerFeature.register(container);
            SyncTableManagerFeature.register(container);

            HeadlessCmsPgOsFeature.register(container);
        }
    });

    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });

    plugin.name = "cms.registerPgOsStorageOperations";

    return [plugin];
};
```

- [ ] **Step 3: Update barrel export**

```typescript
// packages/api-headless-cms-pg-os/src/index.ts
export {
    HeadlessCmsPgOsFeature,
    registerPgOsStorageOperations,
    type IPgOsStorageOperationsConfig
} from "./features/HeadlessCmsPgOsFeature.js";
```

- [ ] **Step 4: Verify build**

```bash
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-pg-os/
git commit -m "feat(api-headless-cms-pg-os): add composite feature, factory, and registration"
```

---

### Task 5: Test infrastructure and integration tests

Set up test infrastructure that uses PGlite for PostgreSQL and the real OpenSearch test client, bridged by `api-sync-pg-to-opensearch` to sync data from the PG sync table to OS. Then wire it into the standard CMS test harness via `setStorageOps`.

**Files:**
- Create: `packages/api-headless-cms-pg-os/__tests__/__api__/setupFile.js`
- Create: `packages/api-headless-cms-pg-os/__tests__/__api__/setupAfterEnv.js`
- Create: `packages/api-headless-cms-pg-os/__tests__/__api__/presets.js`
- Create: `packages/api-headless-cms-pg-os/__tests__/__api__/createPgliteClient.js`
- Create: `packages/api-headless-cms-pg-os/__tests__/__api__/syncBridge.js`

**Interfaces:**
- Consumes: `registerPgOsStorageOperations` (Task 4), `createPgToOpenSearchHandler` from `@webiny/api-sync-pg-to-opensearch`, OpenSearch test utilities
- Produces: Test setup files that enable running the standard CMS test suite against pg-os storage

- [ ] **Step 1: Create PGlite client helper**

Copy from `packages/api-headless-cms-sql/__tests__/__api__/createPgliteClient.js` — same file, no changes:

```javascript
// packages/api-headless-cms-pg-os/__tests__/__api__/createPgliteClient.js
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

export async function createKnex() {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await server.start();

    global.__testPglite = db;
    global.__testPgliteServer = server;

    return knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            port: server.port,
            database: "postgres"
        },
        pool: { min: 1, max: 1 }
    });
}

export async function dropAllTables(knex) {
    const result = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    for (const { tablename } of result.rows) {
        await knex.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
    }
}

export async function teardown() {
    const knex = global.__testKnex;
    if (knex) {
        global.__testKnex = null;
        await knex.destroy();
    }

    const server = global.__testPgliteServer;
    if (server) {
        global.__testPgliteServer = null;
        await server.stop();
    }

    const db = global.__testPglite;
    if (db) {
        global.__testPglite = null;
        await db.close();
    }
}
```

- [ ] **Step 2: Create sync bridge**

The sync bridge reads all rows from the PG sync table and feeds them to the PG-to-OpenSearch handler. This replaces the ddb-es `simulateStream` pattern.

```javascript
// packages/api-headless-cms-pg-os/__tests__/__api__/syncBridge.js
export const createSyncBridge = (knex, syncTableName, handler) => {
    return async () => {
        const hasTable = await knex.schema.hasTable(syncTableName);
        if (!hasTable) {
            return;
        }

        const rows = await knex(syncTableName).select("*");
        if (rows.length === 0) {
            return;
        }

        const records = rows.map(row => ({
            id: row.id,
            entryId: row.entryId,
            index: row.index,
            operation: row.operation,
            data: JSON.parse(row.data),
            tenant: row.tenant
        }));

        await handler(records);

        // Clear processed rows.
        await knex(syncTableName).delete();
    };
};
```

- [ ] **Step 3: Create setupFile.js**

```javascript
// packages/api-headless-cms-pg-os/__tests__/__api__/setupFile.js
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerPgOsStorageOperations } from "../../src/index.js";
import { createCmsEntryFieldSortingPlugin } from "@webiny/api-headless-cms-storage/plugins/CmsEntryFieldSortingPlugin.js";
import { registerSQLCore } from "@webiny/api-core-sql";
import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import {
    getTestOpenSearchClient,
    registerOpenSearchCoreForTests
} from "@webiny/api-opensearch/testing/index.js";
import { getBaseConfiguration, getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import { createPgToOpenSearchHandler } from "@webiny/api-sync-pg-to-opensearch";
import { createSyncBridge } from "./syncBridge.js";

const prefix = getOpenSearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-pg-os-env-`;
}

const client = await import("./createPgliteClient.js");
const knex = global.__testKnex || (await client.createKnex());
global.__testKnex = knex;
global.__testClient = client;

const opensearchClient = getTestOpenSearchClient();
const syncHandler = createPgToOpenSearchHandler(opensearchClient);

// The sync table name depends on TableNameResolver.
// With no prefix/suffix and sharedTables=false, it resolves to "cms_os_sync".
const syncTableName = "cms_os_sync";
const syncBridge = createSyncBridge(knex, syncTableName, syncHandler);

// Store sync bridge globally so setupAfterEnv can call it.
global.__testSyncBridge = syncBridge;

const tableNamePrefix = process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";

setStorageOps("cms", () => {
    const createIndexName = model => {
        const { index } = configurations.es({ model });
        return index;
    };

    const createOrRefreshIndexSubscription = createRegisterExtensionPlugin(({ container }) => {
        container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle(event) {
                const client = container.resolve(OpenSearchClient);
                const { model } = event.payload;
                const index = createIndexName(model);
                try {
                    const response = await client.use().indices.exists({ index });
                    if (response.body) {
                        return;
                    }
                    await client.use().indices.create({
                        index,
                        body: { ...getBaseConfiguration().body }
                    });
                } catch {}
            }
        }));
    });
    createOrRefreshIndexSubscription.name = "headlessCmsPgOs.context.createOrRefreshIndexSubscription";

    const fruitModifierPlugin = createRegisterExtensionPlugin(({ container }) => {
        const FruitBodyModifier = CmsEntryOpenSearchBodyModifier.createImplementation({
            implementation: class {
                modelId = "fruit";
                modifyBody({ body }) {
                    if (!body.sort.customSorter) {
                        return;
                    }
                    const order = body.sort.customSorter.order;
                    delete body.sort.customSorter;
                    body.sort = {
                        createdOn: { order, unmapped_type: "date" }
                    };
                }
            },
            dependencies: []
        });
        container.register(FruitBodyModifier);
    });
    fruitModifierPlugin.name = "headlessCmsPgOs.plugins.fruitModifierPlugin";

    return {
        storageOperations: {},
        plugins: [
            registerSQLCore({ knex }),
            registerOpenSearchCoreForTests(),
            ...registerPgOsStorageOperations({ knex, tableNamePrefix }),
            createOrRefreshIndexSubscription,
            fruitModifierPlugin,
            createCmsEntryFieldSortingPlugin({
                canUse: params => params.fieldId === "customSorter",
                createSort: params => {
                    const { order, fields } = params;
                    const field = Object.values(fields).find(f => f.fieldId === "createdBy");
                    if (!field) {
                        throw new Error("Impossible, but it seems there is no field createdBy.");
                    }
                    return {
                        reverse: order === "DESC",
                        valuePath: "createdBy.id",
                        field,
                        fieldId: field.fieldId
                    };
                }
            })
        ]
    };
});
```

- [ ] **Step 4: Create setupAfterEnv.js**

```javascript
// packages/api-headless-cms-pg-os/__tests__/__api__/setupAfterEnv.js
import { beforeEach, afterEach, afterAll } from "vitest";
import { setupTestIndexManager } from "@webiny/api-opensearch/testing";

setupTestIndexManager({ global });

beforeEach(async () => {
    const knex = global.__testKnex;
    if (!knex) {
        return;
    }

    await global.__testClient.dropAllTables(knex);

    const managers = globalThis.__sqlTableManagers || [];
    for (const manager of managers) {
        manager.reset();
    }
});

afterEach(async () => {
    // After each test, flush sync table to OpenSearch.
    const syncBridge = global.__testSyncBridge;
    if (syncBridge) {
        await syncBridge();
    }
});

afterAll(async () => {
    await global.__testClient.teardown();
});
```

- [ ] **Step 5: Create presets.js**

```javascript
// packages/api-headless-cms-pg-os/__tests__/__api__/presets.js
import { resolve } from "path";

export default [
    {
        setupFiles: [resolve(import.meta.dirname, "setupFile.js")],
        setupFilesAfterEnv: [resolve(import.meta.dirname, "setupAfterEnv.js")]
    }
];
```

- [ ] **Step 6: Create vitest.config.ts** (if not already created in Task 1)

Check `packages/api-headless-cms-sql/vitest.config.ts` and model after it. The key is to use the presets from `__tests__/__api__/presets.js`.

- [ ] **Step 7: Run the standard CMS test suite**

The standard CMS tests live in `packages/api-headless-cms/__tests__/` and are configured to run against whichever storage ops are set via `setStorageOps`. To verify pg-os works, run the same tests that ddb-es and sql run.

First, check which test files ddb-es runs. Then try running one basic test file:

```bash
WEBINY_SQL_CLIENT=pglite yarn vitest run packages/api-headless-cms-pg-os/__tests__/ 2>&1 | tail -50
```

If no tests exist yet in the pg-os package, run the shared CMS tests that are configured to discover storage presets. Check how `packages/api-headless-cms-ddb-es` runs tests — it likely inherits tests from the CMS core package.

**Note:** At this stage, tests may fail if the sync bridge timing doesn't work (OS might not have data when list is called right after create). The sync bridge runs `afterEach`, but the test might call `list` within the same test. In that case, the sync bridge must be called inline in the test or the `list` operation must wait.

If timing is an issue, consider calling the sync bridge explicitly after writes within list-dependent tests, or wiring it as a post-write hook in the entry operations.

- [ ] **Step 8: Fix sync timing if needed**

The afterEach sync bridge approach only works if tests don't mix writes and list queries within a single test. For CMS integration tests, writes and reads are often in the same test.

Solution: Make the sync bridge callable from the entry operations. Add a test hook that triggers sync after every write:

In `setupFile.js`, add after the sync bridge creation:
```javascript
// Expose for entry ops to call after writes during tests.
global.__testSyncAfterWrite = syncBridge;
```

Then in the entry operations, after each write operation, check if the test hook exists and call it:
```typescript
const syncAfterWrite = async () => {
    const hook = (globalThis as any).__testSyncAfterWrite;
    if (hook) {
        await hook();
        // Give OS a moment to index.
        await new Promise(r => setTimeout(r, 100));
    }
};
```

Call `syncAfterWrite()` at the end of each write operation in `entry/index.ts`.

Alternatively, use OpenSearch's `refresh` API after the sync to force immediate indexing (the ddb-es tests already do this).

- [ ] **Step 9: Commit**

```bash
git add packages/api-headless-cms-pg-os/
git commit -m "feat(api-headless-cms-pg-os): add test infrastructure with PGlite + OpenSearch"
```

---

### Task 6: Validate with CMS test suite and fix issues

Run the full CMS test suite against pg-os and fix any failures.

**Files:**
- Modify: any pg-os files as needed to fix test failures

**Interfaces:**
- Consumes: everything from Tasks 1-5
- Produces: all CMS tests passing with pg-os storage

- [ ] **Step 1: Identify which tests to run**

Check how ddb-es tests are organized:

```bash
ls packages/api-headless-cms-ddb-es/__tests__/ 2>/dev/null
```

The ddb-es package uses `ci.config.json` with `"storageOps": ["ddb-os,ddb"]` which tells CI which presets to use. The actual tests come from the shared CMS test suite in `packages/api-headless-cms/__tests__/`.

For pg-os, the `ci.config.json` has `"storageOps": ["pg-os,ddb"]`. Run tests:

```bash
yarn test:os packages/api-headless-cms-pg-os 2>&1 | tail -50
```

- [ ] **Step 2: Fix test failures iteratively**

Common issues to expect:
1. **Missing imports or wrong paths** — fix imports in entry/index.ts or HeadlessCmsPgOsFeature.ts
2. **Sync timing** — OS doesn't have data yet when list is called. Fix with inline sync bridge calls or refresh API
3. **Field key conversion** — entries from OS may need key conversion. Check if `extractEntriesFromIndex` returns correct format
4. **Missing operations** — some CMS operations might have params that differ from what we handle. Check the CmsEntryStorageOperations interface for any missing methods
5. **Type mismatches** — storageEntry vs entry param types

For each failure:
1. Read the error message
2. Trace to the root cause
3. Fix the minimum code needed
4. Re-run the failing test

- [ ] **Step 3: Run full suite and verify all pass**

```bash
yarn test:os packages/api-headless-cms-pg-os 2>&1 | tail -50
```

Expected: All tests pass.

- [ ] **Step 4: Run pre-commit checks**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(api-headless-cms-pg-os): pass full CMS test suite"
```

---

## Notes for implementer

### Key pattern differences from ddb-es

| Concern | ddb-es | pg-os |
|---------|--------|-------|
| Main table writes | DDB entities + batch writer | SQL package (knex) |
| Sync table writes | DDB ES entity + batch writer | Direct PG inserts via knex |
| Key transforms | `convertEntryKeysTo/FromStorage` (DDB-specific key format) | Not needed — PG stores original format |
| Read-modify-write for sync | Yes (decompress old ES data, patch, recompress) | No — always prepare fresh OS document from entry |
| DataLoaders | Yes (DDB batch get optimization) | Not needed — SQL point reads are efficient |
| Transactions | None (DDB main + DDB ES are separate batch writes) | Single PG transaction (main + sync in same DB) |
| Test bridge | `simulateStream` (DDB Streams mock) | `syncBridge` (read sync table, feed to handler) |

### Import paths

The SQL package exports from deep paths like `@webiny/api-headless-cms-sql/operations/entry/index.js` and `@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js`. These are accessible because of the `"./*": "./*"` exports pattern in package.json.

### Debugging tips

- If OS queries return empty results, check that:
  1. The sync bridge ran after the write
  2. The OS index exists (check for `index_not_found_exception`)
  3. The OS index was refreshed after sync
- If entries have wrong values after OS list, check the `transformEntryToIndex` / `extractEntriesFromIndex` roundtrip
- If compression fails, check that `CompressionFeature` is registered in the container
