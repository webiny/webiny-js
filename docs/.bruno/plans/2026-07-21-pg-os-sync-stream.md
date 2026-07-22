# PG-to-OpenSearch Sync Stream Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sync pipeline that captures changes to the `os_sync` PG table and pushes them to OpenSearch, with a test simulation modeled after the DynamoDB Streams pattern.

**Architecture:** `SyncWriter` writes/deletes rows in `os_sync`. `simulatePgStream` intercepts knex operations and produces `SyncEvent[]`. `SyncEventHandler` receives events, decompresses data, feeds `SynchronizationBuilder` to flush to OS.

**Tech Stack:** TypeScript, knex, PGlite (test), OpenSearch, Webiny DI (`@webiny/feature`), `@webiny/api-sync-to-opensearch`

## Global Constraints

- Follow existing DI patterns: `createAbstraction` + `createImplementation` + `createFeature`
- One abstraction/implementation/feature per file
- No inline types — extract to named interfaces
- Tests require real OpenSearch (localhost:9200) — run with `yarn test:os`
- PGlite + pglite-socket + knex for test PG (existing pattern)

---

### Task 1: Add `SyncEvent` type to `types.ts`

**Files:**
- Modify: `packages/api-headless-cms-pg-os/src/types.ts`

**Interfaces:**
- Consumes: existing `ISyncRow`
- Produces: `SyncEvent` type used by tasks 2-7

- [ ] **Step 1: Add SyncEvent interface**

In `packages/api-headless-cms-pg-os/src/types.ts`, add after the `ISyncRow` interface:

```typescript
export type SyncEventType = "INSERT" | "MODIFY" | "REMOVE";

export interface SyncEvent {
    type: SyncEventType;
    id: string;
    entryId: string;
    tenant: string;
    index: string;
    data?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/types.ts
git commit -m "feat(api-headless-cms-pg-os): add SyncEvent type"
```

---

### Task 2: Change `SyncWriter` remove methods to DELETE rows

**Files:**
- Modify: `packages/api-headless-cms-pg-os/src/operations/entry/syncWriter.ts`
- Test: `packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts`

**Interfaces:**
- Consumes: `SyncWriter` interface (unchanged), `SyncTableManager`, knex
- Produces: `SyncWriter.removeEntry/removeLatest/removePublished` now DELETE rows from os_sync instead of upserting REMOVE rows

- [ ] **Step 1: Update existing remove test expectations**

In `packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts`, update the test "should write a REMOVE record for latest":

```typescript
it("should delete the row for removeLatest", async () => {
    const { syncTableManager, syncWriter } = setup();
    await syncTableManager.ensureTable();

    const model = createModel() as any;
    const entry = createEntry() as any;

    await syncWriter.writeLatest({ model, entry, storageEntry: entry });

    const rowsBefore: ISyncRow[] = await knex(syncTableManager.getTableName());
    expect(rowsBefore).toHaveLength(1);

    await syncWriter.removeLatest({ model, entryId: entry.entryId });

    const rowsAfter: ISyncRow[] = await knex(syncTableManager.getTableName());
    expect(rowsAfter).toHaveLength(0);
});
```

Update "should write a REMOVE record for published":

```typescript
it("should delete the row for removePublished", async () => {
    const { syncTableManager, syncWriter } = setup();
    await syncTableManager.ensureTable();

    const model = createModel() as any;
    const entry = createEntry({ status: "published" }) as any;

    await syncWriter.writePublished({ model, entry, storageEntry: entry });

    const rowsBefore: ISyncRow[] = await knex(syncTableManager.getTableName());
    expect(rowsBefore).toHaveLength(1);

    await syncWriter.removePublished({ model, entryId: entry.entryId });

    const rowsAfter: ISyncRow[] = await knex(syncTableManager.getTableName());
    expect(rowsAfter).toHaveLength(0);
});
```

Update "should overwrite a write with a subsequent remove":

```typescript
it("should delete row on remove after write", async () => {
    const { syncTableManager, syncWriter } = setup();
    await syncTableManager.ensureTable();

    const model = createModel() as any;
    const entry = createEntry() as any;

    await syncWriter.writeLatest({ model, entry, storageEntry: entry });
    await syncWriter.removeLatest({ model, entryId: entry.entryId });

    const rows: ISyncRow[] = await knex(syncTableManager.getTableName());
    expect(rows).toHaveLength(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test packages/api-headless-cms-pg-os 2>&1 | tail -20`
Expected: 3 tests FAIL (remove tests expect 0 rows but get 1 row with operation=REMOVE)

- [ ] **Step 3: Update SyncWriter remove methods to DELETE**

In `packages/api-headless-cms-pg-os/src/operations/entry/syncWriter.ts`, replace the `buildRemoveRecord` function and all three remove methods:

Remove the `buildRemoveRecord` function entirely (lines 112-125).

Replace the return object's remove methods with:

```typescript
async removeEntry(removeParams) {
    const { entryId } = removeParams;
    await query()
        .whereIn("id", [`${entryId}:L`, `${entryId}:P`])
        .delete();
},
async removeLatest(removeParams) {
    await query()
        .where("id", `${removeParams.entryId}:L`)
        .delete();
},
async removePublished(removeParams) {
    await query()
        .where("id", `${removeParams.entryId}:P`)
        .delete();
}
```

Also remove the unused `OperationType` import and `configurations` import if no longer used by remove methods (check: `buildRecord` still uses `configurations` — keep it; `OperationType` is only used in `buildRecord` via `OperationType.MODIFY` — keep it).

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test packages/api-headless-cms-pg-os 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/syncWriter.ts packages/api-headless-cms-pg-os/__tests__/syncWriter.test.ts
git commit -m "refactor(api-headless-cms-pg-os): SyncWriter removes rows via DELETE instead of upserting REMOVE"
```

---

### Task 3: Create `SyncEventHandler` abstraction

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/features/syncEventHandler/abstractions.ts`

**Interfaces:**
- Consumes: `SyncEvent` from types.ts (task 1)
- Produces: `SyncEventHandler` abstraction used by tasks 4, 5, 6, 7

- [ ] **Step 1: Create abstractions file**

```typescript
import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SyncEvent } from "~/types.js";

export interface ISyncEventHandlerProcessOptions {
    batchSize?: number;
}

export interface ISyncEventHandler {
    process(events: SyncEvent[], options?: ISyncEventHandlerProcessOptions): Promise<void>;
}

export const SyncEventHandler = createAbstraction<ISyncEventHandler>("Cms/PgOs/SyncEventHandler");

export namespace SyncEventHandler {
    export type Interface = ISyncEventHandler;
    export type ProcessOptions = ISyncEventHandlerProcessOptions;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/features/syncEventHandler/abstractions.ts
git commit -m "feat(api-headless-cms-pg-os): add SyncEventHandler abstraction"
```

---

### Task 4: Create `SyncEventHandler` implementation

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/features/syncEventHandler/SyncEventHandler.ts`

**Interfaces:**
- Consumes: `SyncEventHandler` abstraction (task 3), `SynchronizationBuilder` from `@webiny/api-sync-to-opensearch`, `CompressionHandler` from `@webiny/utils`
- Produces: `SyncEventHandler` DI implementation, used by task 5 (feature registration) and task 7 (tests)

- [ ] **Step 1: Create implementation file**

```typescript
import { SyncEventHandler as SyncEventHandlerAbstraction } from "./abstractions.js";
import { SynchronizationBuilder } from "@webiny/api-sync-to-opensearch";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { SyncEvent } from "~/types.js";

const DEFAULT_BATCH_SIZE = 50;

class SyncEventHandlerImpl implements SyncEventHandlerAbstraction.Interface {
    public constructor(
        private readonly synchronizationBuilder: SynchronizationBuilder.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    public async process(
        events: SyncEvent[],
        options?: SyncEventHandlerAbstraction.ProcessOptions
    ): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;

        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            await this.processBatch(batch);
        }
    }

    private async processBatch(events: SyncEvent[]): Promise<void> {
        for (const event of events) {
            if (event.type === "REMOVE") {
                this.synchronizationBuilder.delete({
                    id: event.id,
                    index: event.index
                });
                continue;
            }

            if (!event.data) {
                continue;
            }

            const parsed = JSON.parse(event.data);
            const decompressed = await this.compressionHandler.decompress(parsed);

            this.synchronizationBuilder.insert({
                id: event.id,
                index: event.index,
                data: decompressed
            });
        }

        const flush = this.synchronizationBuilder.build();
        await flush();
    }
}

export const SyncEventHandler = SyncEventHandlerAbstraction.createImplementation({
    implementation: SyncEventHandlerImpl,
    dependencies: [SynchronizationBuilder, CompressionHandler]
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/features/syncEventHandler/SyncEventHandler.ts
git commit -m "feat(api-headless-cms-pg-os): add SyncEventHandler implementation"
```

---

### Task 5: Create `SyncEventHandler` feature registration

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/features/syncEventHandler/feature.ts`

**Interfaces:**
- Consumes: `SyncEventHandler` implementation (task 4)
- Produces: `SyncEventHandlerFeature` used by test setup (task 6) and `HeadlessCmsPgOsFeature`

- [ ] **Step 1: Create feature file**

```typescript
import { createFeature } from "@webiny/feature/api/index.js";
import { SyncEventHandler } from "./SyncEventHandler.js";

export const SyncEventHandlerFeature = createFeature({
    name: "cms.pgOs.syncEventHandler",
    register: container => {
        container.register(SyncEventHandler);
    }
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/features/syncEventHandler/feature.ts
git commit -m "feat(api-headless-cms-pg-os): add SyncEventHandlerFeature DI registration"
```

---

### Task 6: Create `simulatePgStream` test utility

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/testing/simulatePgStream.ts`

**Interfaces:**
- Consumes: `SyncEvent` from types.ts (task 1), knex
- Produces: `simulatePgStream` function used by tests (task 7)

The simulation intercepts knex's internal `client.query` method to detect operations on the target table. For upserts (INSERT ... ON CONFLICT), it checks row existence before the operation to determine INSERT vs MODIFY. For DELETEs, it reads the row before deletion to capture its metadata.

- [ ] **Step 1: Create simulatePgStream**

```typescript
import type { Knex } from "knex";
import type { SyncEvent, ISyncRow, SyncEventType } from "~/types.js";

interface SimulatePgStreamParams {
    knex: Knex;
    tableName: string;
    handler: (events: SyncEvent[]) => Promise<void>;
}

const toSyncEvent = (row: ISyncRow, type: SyncEventType): SyncEvent => ({
    type,
    id: row.id,
    entryId: row.entryId,
    tenant: row.tenant,
    index: row.index,
    ...(type !== "REMOVE" ? { data: row.data } : {})
});

/**
 * Snapshot-diff approach: capture all rows before the operation, execute,
 * capture all rows after, diff to determine what changed. Robust against
 * SQL structure changes — no binding offset parsing.
 */
export const simulatePgStream = (params: SimulatePgStreamParams): void => {
    const { knex, tableName, handler } = params;
    const query = () => knex<ISyncRow>(tableName);

    const originalClient = knex.client;
    const originalQuery = originalClient.query.bind(originalClient);

    originalClient.query = async (connection: any, obj: any) => {
        const sql: string = typeof obj === "string" ? obj : obj?.sql ?? "";
        const isTargetTable = sql.includes(tableName);

        if (!isTargetTable) {
            return originalQuery(connection, obj);
        }

        const upperSql = sql.toUpperCase();
        const isInsert = upperSql.includes("INSERT");
        const isDelete = upperSql.includes("DELETE");

        if (!isInsert && !isDelete) {
            return originalQuery(connection, obj);
        }

        const rowsBefore = await query().select("*");
        const beforeMap = new Map(rowsBefore.map(r => [r.id, r]));

        const result = await originalQuery(connection, obj);

        const rowsAfter = await query().select("*");
        const afterMap = new Map(rowsAfter.map(r => [r.id, r]));

        const events: SyncEvent[] = [];

        if (isInsert) {
            for (const [id, row] of afterMap) {
                const before = beforeMap.get(id);
                if (!before) {
                    events.push(toSyncEvent(row, "INSERT"));
                } else if (before.data !== row.data) {
                    events.push(toSyncEvent(row, "MODIFY"));
                }
            }
        }

        if (isDelete) {
            for (const [id, row] of beforeMap) {
                if (!afterMap.has(id)) {
                    events.push(toSyncEvent(row, "REMOVE"));
                }
            }
        }

        if (events.length > 0) {
            await handler(events);
        }

        return result;
    };
};
```

- [ ] **Step 2: Create testing index export**

Create `packages/api-headless-cms-pg-os/src/testing/index.ts`:

```typescript
export { simulatePgStream } from "./simulatePgStream.js";
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/testing/
git commit -m "feat(api-headless-cms-pg-os): add simulatePgStream test utility"
```

---

### Task 7: Create `createReindexEvents` utility

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/testing/createReindexEvents.ts`
- Modify: `packages/api-headless-cms-pg-os/src/testing/index.ts`

**Interfaces:**
- Consumes: `SyncEvent`, `ISyncRow` from types.ts
- Produces: `createReindexEvents` function used by reindex test (task 9)

- [ ] **Step 1: Create createReindexEvents**

```typescript
import type { Knex } from "knex";
import type { SyncEvent, ISyncRow } from "~/types.js";

export const createReindexEvents = async (
    knex: Knex,
    tableName: string
): Promise<SyncEvent[]> => {
    const rows: ISyncRow[] = await knex<ISyncRow>(tableName).select("*");

    return rows.map(row => ({
        type: "INSERT" as const,
        id: row.id,
        entryId: row.entryId,
        tenant: row.tenant,
        index: row.index,
        data: row.data
    }));
};
```

- [ ] **Step 2: Add export to testing index**

In `packages/api-headless-cms-pg-os/src/testing/index.ts`, add:

```typescript
export { createReindexEvents } from "./createReindexEvents.js";
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/testing/
git commit -m "feat(api-headless-cms-pg-os): add createReindexEvents utility"
```

---

### Task 8: Create test helper `createSyncTestSetup`

**Files:**
- Create: `packages/api-headless-cms-pg-os/__tests__/helpers/createSyncTestSetup.ts`

**Interfaces:**
- Consumes: All DI features (tasks 3-5), `createTestOpenSearchClient` from `@webiny/api-opensearch/testing`, PGlite infra
- Produces: `createSyncTestSetup` function used by all sync tests (task 9)

This helper wires up the full DI container with PG + OS + sync features. Follows existing pattern from `syncWriter.test.ts` but adds OS and sync-to-opensearch dependencies.

- [ ] **Step 1: Create the test setup helper**

```typescript
import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import {
    CmsEntryOpenSearchFieldIndexFeature,
    CmsEntryOpenSearchFieldIndexRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { SyncTableManagerFeature } from "../../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../../src/features/syncTableManager/abstractions.js";
import { SyncEventHandlerFeature } from "../../src/features/syncEventHandler/feature.js";
import { SyncEventHandler } from "../../src/features/syncEventHandler/abstractions.js";
import { createSyncWriter } from "../../src/operations/entry/syncWriter.js";
import {
    SynchronizationBuilderFeature,
    ExecuteSyncFeature,
    ExecuteSyncWithRetryFeature,
    OperationsFactoryFeature
} from "@webiny/api-sync-to-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    createTestOpenSearchClient,
    type TestOpenSearchClient
} from "@webiny/api-opensearch/testing";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { Env } from "@webiny/stdlib";
import { simulatePgStream } from "../../src/testing/simulatePgStream.js";
import type { SyncEvent } from "../../src/types.js";

export const createSyncTestSetup = async () => {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await server.start();

    const knex = knexLib({
        client: "pg",
        connection: { host: "127.0.0.1", port: server.port, database: "postgres" },
        pool: { min: 1, max: 1 }
    });

    const osClient = createTestOpenSearchClient();

    const container = new Container();

    container.registerInstance(KnexClient, { client: knex });
    container.registerInstance(TableNameResolverConfig, { sharedTables: false });
    container.registerInstance(CmsModelFieldToGraphQLRegistry, {
        get: () => undefined,
        getAll: () => []
    });
    container.registerInstance(OpenSearchClient, { use: () => osClient });
    container.registerInstance(Timer, { getRemainingSeconds: () => 300 });
    container.registerInstance(Env, {
        getString: (_key: string, fallback?: string) => fallback ?? "",
        getStringOrThrow: (key: string) => { throw new Error(`Env ${key} not set`); },
        getNumber: (_key: string, fallback?: number) => fallback ?? 0,
        getNumberOrThrow: (key: string) => { throw new Error(`Env ${key} not set`); },
        getBoolean: (key: string, fallback?: boolean) => {
            if (key === "TESTING") {
                return true;
            }
            return fallback ?? false;
        },
        getBooleanOrThrow: (key: string) => { throw new Error(`Env ${key} not set`); }
    });

    TableNameResolverFeature.register(container);
    CompressionFeature.register(container);
    CmsEntryOpenSearchFieldIndexFeature.register(container);
    SyncTableManagerFeature.register(container);
    OperationsFactoryFeature.register(container);
    ExecuteSyncFeature.register(container);
    ExecuteSyncWithRetryFeature.register(container);
    SynchronizationBuilderFeature.register(container);
    SyncEventHandlerFeature.register(container);

    const syncTableManager = container.resolve(SyncTableManager);
    const compressionHandler = container.resolve(CompressionHandler);
    const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
    const syncEventHandler = container.resolve(SyncEventHandler);

    const syncWriter = createSyncWriter({
        knex,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    await syncTableManager.ensureTable();

    const capturedEvents: SyncEvent[] = [];

    simulatePgStream({
        knex,
        tableName: syncTableManager.getTableName(),
        handler: async (events) => {
            capturedEvents.push(...events);
        }
    });

    const cleanup = async () => {
        await osClient.indices.deleteAll();
        await knex.destroy();
        await server.stop();
        await db.close();
    };

    return {
        knex,
        osClient,
        container,
        syncTableManager,
        syncWriter,
        syncEventHandler,
        capturedEvents,
        cleanup
    };
};

export const createModel = (overrides = {}) => ({
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

export const createEntry = (overrides = {}) => ({
    id: "entry1#0001",
    entryId: "entry1",
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    version: 1,
    status: "draft" as const,
    locked: false,
    isLatest: true,
    isPublished: false,
    values: { title: "Test Entry" },
    ...overrides
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/__tests__/helpers/
git commit -m "feat(api-headless-cms-pg-os): add createSyncTestSetup helper"
```

---

### Task 9: Write sync stream integration tests

**Files:**
- Create: `packages/api-headless-cms-pg-os/__tests__/syncStream.test.ts`

**Interfaces:**
- Consumes: `createSyncTestSetup`, `createModel`, `createEntry` (task 8), `createReindexEvents` (task 7)
- Produces: Integration tests validating full pipeline

All 6 test cases from the spec. Tests run with `yarn test:os packages/api-headless-cms-pg-os`.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createSyncTestSetup, createModel, createEntry } from "./helpers/createSyncTestSetup";
import { createReindexEvents } from "../src/testing/createReindexEvents.js";
import type { ISyncRow } from "../src/types.js";

describe("PG-to-OpenSearch sync stream", () => {
    let setup: Awaited<ReturnType<typeof createSyncTestSetup>>;

    beforeEach(async () => {
        setup = await createSyncTestSetup();
        return () => setup.cleanup();
    });

    it("should sync an INSERT event to OpenSearch", async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("INSERT");
        expect(setup.capturedEvents[0].id).toBe("entry1:L");

        await setup.syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: setup.capturedEvents[0].index,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(1);
        expect(body.hits.hits[0]._id).toBe("entry1:L");
    });

    it("should sync a MODIFY event to OpenSearch", async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        setup.capturedEvents.length = 0;

        const updatedEntry = { ...entry, values: { title: "Updated Title" } };
        await setup.syncWriter.writeLatest({
            model,
            entry: updatedEntry,
            storageEntry: updatedEntry
        });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("MODIFY");

        await setup.syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: setup.capturedEvents[0].index,
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(1);
    });

    it("should sync a REMOVE event to delete from OpenSearch", async () => {
        const model = createModel() as any;
        const entry = createEntry() as any;

        await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        await setup.syncEventHandler.process(setup.capturedEvents);
        setup.capturedEvents.length = 0;

        await setup.syncWriter.removeLatest({ model, entryId: entry.entryId });

        expect(setup.capturedEvents).toHaveLength(1);
        expect(setup.capturedEvents[0].type).toBe("REMOVE");
        expect(setup.capturedEvents[0].id).toBe("entry1:L");

        await setup.syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: "root-headless-cms-testmodel",
            body: { query: { match_all: {} } },
            ignore_unavailable: true
        });

        expect(body.hits.total.value).toBe(0);
    });

    it("should respect batchSize option", async () => {
        const model = createModel() as any;

        for (let i = 1; i <= 5; i++) {
            const entry = createEntry({
                id: `entry${i}#0001`,
                entryId: `entry${i}`
            }) as any;
            await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        }

        expect(setup.capturedEvents).toHaveLength(5);

        await setup.syncEventHandler.process(setup.capturedEvents, { batchSize: 2 });

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: "root-headless-cms-testmodel",
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(5);
    });

    it("should sync both latest and published records", async () => {
        const model = createModel() as any;
        const entry = createEntry({ status: "published" }) as any;

        await setup.syncWriter.writeEntry({ model, entry, storageEntry: entry });

        expect(setup.capturedEvents).toHaveLength(2);
        const ids = setup.capturedEvents.map(e => e.id).sort();
        expect(ids).toEqual(["entry1:L", "entry1:P"]);

        await setup.syncEventHandler.process(setup.capturedEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: "root-headless-cms-testmodel",
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(2);
    });

    it("should reindex all entries from os_sync", async () => {
        const model = createModel() as any;

        for (let i = 1; i <= 3; i++) {
            const entry = createEntry({
                id: `entry${i}#0001`,
                entryId: `entry${i}`
            }) as any;
            await setup.syncWriter.writeLatest({ model, entry, storageEntry: entry });
        }

        setup.capturedEvents.length = 0;

        const reindexEvents = await createReindexEvents(
            setup.knex,
            setup.syncTableManager.getTableName()
        );

        expect(reindexEvents).toHaveLength(3);
        expect(reindexEvents.every(e => e.type === "INSERT")).toBe(true);

        await setup.syncEventHandler.process(reindexEvents);

        await setup.osClient.indices.refreshAll();
        const { body } = await setup.osClient.search({
            index: "root-headless-cms-testmodel",
            body: { query: { match_all: {} } }
        });

        expect(body.hits.total.value).toBe(3);
    });
});
```

- [ ] **Step 2: Run tests**

Run: `yarn test:os packages/api-headless-cms-pg-os 2>&1 | tail -30`
Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/__tests__/syncStream.test.ts
git commit -m "test(api-headless-cms-pg-os): add sync stream integration tests"
```

---

### Task 10: Build, lint, format check

**Files:**
- Possibly modify: `packages/api-headless-cms-pg-os/package.json` (add `@webiny/api-sync-to-opensearch` dep if missing)
- Possibly modify: tsconfig files

- [ ] **Step 1: Add missing dependencies to package.json**

Check if `@webiny/api-sync-to-opensearch` is already a dependency. If not, add it:

```bash
grep "api-sync-to-opensearch" packages/api-headless-cms-pg-os/package.json
```

If missing, add `"@webiny/api-sync-to-opensearch": "0.0.0"` to dependencies.

- [ ] **Step 2: Run pre-commit checks**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -15
git add .
```

- [ ] **Step 3: Fix any issues and commit**

```bash
git commit -m "chore(api-headless-cms-pg-os): formatting, config sync, add sync-to-opensearch dep"
```
