# api-sync-pg-to-opensearch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build WAL-based PG-to-OpenSearch sync adapter, mirroring `api-sync-ddb-to-opensearch` pattern.

**Architecture:** Receives pre-formatted OS documents from PG sync table rows, pushes to OpenSearch via `ExecuteSyncWithRetry`. No AWS deps. Defines a `PgWalChangeRecord` interface for the sync table row format and a simple handler function (no Lambda/event-handler abstraction needed).

**Tech Stack:** `@webiny/feature` (DI), `@webiny/api-sync-to-opensearch` (base sync), `@webiny/api-opensearch`, vitest

## Global Constraints

- Package versions are `"0.0.0"`
- Import paths use `.js` extensions (ESM)
- Zero AWS/DDB imports
- Follow DI pattern: abstraction/implementation/feature
- Mirror `api-sync-ddb-to-opensearch` structure

**Spec:** `docs/.bruno/specs/2026-07-16-headless-cms-pg-os-design.md` (Package 2 section)

---

### Task 1: Scaffold + PgWalChangeRecord Type

**Files:**
- Create: `packages/api-sync-pg-to-opensearch/package.json`
- Create: `packages/api-sync-pg-to-opensearch/tsconfig.json`
- Create: `packages/api-sync-pg-to-opensearch/tsconfig.build.json`
- Create: `packages/api-sync-pg-to-opensearch/webiny.config.js`
- Create: `packages/api-sync-pg-to-opensearch/vitest.config.ts`
- Create: `packages/api-sync-pg-to-opensearch/ci.config.json`
- Create: `packages/api-sync-pg-to-opensearch/src/types.ts`
- Create: `packages/api-sync-pg-to-opensearch/src/index.ts` (placeholder)

**Interfaces:**
- Consumes: nothing
- Produces: `PgWalChangeRecord` interface — the sync table row shape that WAL delivers

- [ ] **Step 1: Create package.json**

```json
{
    "name": "@webiny/api-sync-pg-to-opensearch",
    "version": "0.0.0",
    "type": "module",
    "exports": {
        ".": "./index.js",
        "./*": "./*"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/webiny/webiny-js.git",
        "directory": "packages/api-sync-pg-to-opensearch"
    },
    "description": "PostgreSQL to OpenSearch synchronization adapter via WAL.",
    "license": "MIT",
    "author": "Webiny Ltd.",
    "dependencies": {
        "@webiny/api-opensearch": "0.0.0",
        "@webiny/api-sync-to-opensearch": "0.0.0",
        "@webiny/feature": "0.0.0",
        "@webiny/utils": "0.0.0"
    },
    "devDependencies": {
        "@webiny/build-tools": "0.0.0",
        "typescript": "^7.0.2"
    },
    "publishConfig": {
        "access": "public"
    },
    "adio": {
        "ignoreDirs": ["__tests__"]
    },
    "webiny": {
        "publishFrom": "dist"
    }
}
```

- [ ] **Step 2: Create tsconfig.json**

Follow `api-sync-ddb-to-opensearch/tsconfig.json` pattern. References: `api-opensearch`, `api-sync-to-opensearch`, `feature`, `utils`. Path mappings for each. Include `src` and `__tests__`.

- [ ] **Step 3: Create tsconfig.build.json**

Same references as tsconfig.json. Include only `src`. `rootDir: "./src"`.

- [ ] **Step 4: Create webiny.config.js, vitest.config.ts, ci.config.json**

```js
// webiny.config.js
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";
export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
```

```ts
// vitest.config.ts
import { createTestConfig } from "../../testing";
export default async () => {
    return createTestConfig({ path: import.meta.dirname });
};
```

```json
// ci.config.json
{
    "$schema": "../../.github/workflows/ci.config.schema.json"
}
```

- [ ] **Step 5: Create types.ts**

```ts
// src/types.ts
export interface PgWalChangeRecord {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: string;
    tenant: string;
}
```

- [ ] **Step 6: Create placeholder index.ts**

```ts
// src/index.ts
export type { PgWalChangeRecord } from "./types.js";
```

- [ ] **Step 7: Install deps, verify build**

```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-sync-pg-to-opensearch 2>&1 | tail -10
```

- [ ] **Step 8: Commit**

---

### Task 2: PgOperationsBuilder

**Files:**
- Create: `packages/api-sync-pg-to-opensearch/src/features/PgOperationsBuilder/PgOperationsBuilder.ts`
- Create: `packages/api-sync-pg-to-opensearch/src/features/PgOperationsBuilder/feature.ts`

**Interfaces:**
- Consumes: `OperationsBuilder` abstraction from `@webiny/api-sync-to-opensearch`, `OperationsFactory` from same, `CompressionHandler` from `@webiny/utils`, `PgWalChangeRecord` from Task 1
- Produces: `PgOperationsBuilder` implementation, `PgOperationsBuilderFeature`

The PG builder is simpler than DDB — no unmarshalling needed. Sync table rows already contain the id, index, operation, and compressed data fields directly.

- [ ] **Step 1: Create PgOperationsBuilder implementation**

```ts
// src/features/PgOperationsBuilder/PgOperationsBuilder.ts
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";
import type { Operations } from "@webiny/api-sync-to-opensearch/features/Operations/abstractions/Operations.js";
import { OperationsFactory } from "@webiny/api-sync-to-opensearch/features/Operations/abstractions/OperationsFactory.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { PgWalChangeRecord } from "~/types.js";

class PgOperationsBuilderImpl implements OperationsBuilder.Interface<PgWalChangeRecord> {
    public constructor(
        private readonly compressor: CompressionHandler.Interface,
        private readonly operationsFactory: OperationsFactory.Interface
    ) {}

    public async build(params: {
        records: PgWalChangeRecord[];
    }): Promise<Operations.Interface> {
        const operations = this.operationsFactory.create();
        for (const record of params.records) {
            if (!record.id || !record.index) {
                console.error(`Missing id or index in sync record, skipping.`);
                continue;
            }

            if (
                record.operation === OperationType.INSERT ||
                record.operation === OperationType.MODIFY
            ) {
                if (!record.data) {
                    console.error(
                        `Missing data for ${record.operation} operation, ID ${record.id}. Skipping.`
                    );
                    continue;
                }
                const data = await this.compressor.decompress({
                    compression: "jsonpack",
                    value: record.data
                });
                if (data === undefined || data === null) {
                    console.error(
                        `Could not decompress data for operation "${record.operation}", ID ${record.id}. Skipping.`
                    );
                    continue;
                }

                operations.insert({
                    id: record.id,
                    index: record.index,
                    data
                });
            } else if (record.operation === OperationType.REMOVE) {
                operations.delete({
                    id: record.id,
                    index: record.index
                });
            }
        }
        return operations;
    }
}

export const PgOperationsBuilder = OperationsBuilder.createImplementation({
    implementation: PgOperationsBuilderImpl,
    dependencies: [CompressionHandler, OperationsFactory]
});
```

Note: The `compressor.decompress` call assumes the data is compressed with jsonpack (same as DDB adapter). The actual compression format is set by `pg-os` when writing to the sync table — verify this matches when building `pg-os`.

- [ ] **Step 2: Create feature**

```ts
// src/features/PgOperationsBuilder/feature.ts
import { createFeature } from "@webiny/feature/api";
import { PgOperationsBuilder } from "./PgOperationsBuilder.js";

export const PgOperationsBuilderFeature = createFeature({
    name: "sync.pg.operationsBuilder",
    register(container) {
        container.register(PgOperationsBuilder);
    }
});
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-sync-pg-to-opensearch 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

---

### Task 3: PgToOpenSearchFeature (Composite) + Factory

**Files:**
- Create: `packages/api-sync-pg-to-opensearch/src/features/PgToOpenSearchFeature.ts`
- Create: `packages/api-sync-pg-to-opensearch/src/createPgToOpenSearchHandler.ts`
- Modify: `packages/api-sync-pg-to-opensearch/src/index.ts`

**Interfaces:**
- Consumes: All base sync features from `@webiny/api-sync-to-opensearch`, `PgOperationsBuilderFeature` from Task 2, `OpenSearchClientFeature`, `CompressionFeature`
- Produces: `PgToOpenSearchFeature` (composite), `createPgToOpenSearchHandler` factory, `PgToOpenSearchHandler` type

Unlike the DDB adapter which uses `DynamoDBEventHandler` abstraction and Lambda wiring, the PG adapter exposes a simple async function: `(records: PgWalChangeRecord[]) => Promise<void>`. The WAL listener calls this function with batches of sync table rows.

- [ ] **Step 1: Create PgToOpenSearchFeature (composite)**

```ts
// src/features/PgToOpenSearchFeature.ts
import { createFeature } from "@webiny/feature/api";
import type { Client } from "@webiny/api-opensearch/client.js";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch/features/Operations/feature.js";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/feature.js";
import { PgOperationsBuilderFeature } from "./PgOperationsBuilder/feature.js";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";

export interface PgToOpenSearchFeatureConfig {
    client: Client;
}

export const PgToOpenSearchFeature = createFeature<PgToOpenSearchFeatureConfig>({
    name: "sync.pg-to-opensearch",
    register(container, config) {
        OpenSearchClientFeature.register(container, config.client);
        CompressionFeature.register(container);

        OperationsFactoryFeature.register(container);
        ExecuteSyncFeature.register(container);
        ExecuteSyncWithRetryFeature.register(container);
        SynchronizationBuilderFeature.register(container);

        PgOperationsBuilderFeature.register(container);
    }
});
```

- [ ] **Step 2: Create factory function**

```ts
// src/createPgToOpenSearchHandler.ts
import { Container } from "@webiny/feature/api";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { ExecuteSyncWithRetry } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/abstraction.js";
import { PgToOpenSearchFeature } from "./features/PgToOpenSearchFeature.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { PgWalChangeRecord } from "./types.js";

const MAX_RUNNING_TIME = 900;

export type PgToOpenSearchHandler = (records: PgWalChangeRecord[]) => Promise<void>;

export const createPgToOpenSearchHandler = (client: Client): PgToOpenSearchHandler => {
    const container = new Container();

    ProcessEnvFeature.register(container);
    TimerFeature.register(container, {
        getRemainingSeconds: () => MAX_RUNNING_TIME,
        getRemainingMilliseconds: () => MAX_RUNNING_TIME * 1000
    });

    PgToOpenSearchFeature.register(container, { client });

    const builder = container.resolve(OperationsBuilder);
    const executeSyncWithRetry = container.resolve(ExecuteSyncWithRetry);

    return async (records: PgWalChangeRecord[]): Promise<void> => {
        const operations = await builder.build({ records });

        if (operations.total === 0) {
            return;
        }

        await executeSyncWithRetry.execute({
            maxRunningTime: MAX_RUNNING_TIME,
            operations
        });
    };
};
```

- [ ] **Step 3: Update barrel export**

```ts
// src/index.ts
export type { PgWalChangeRecord } from "./types.js";
export {
    createPgToOpenSearchHandler,
    type PgToOpenSearchHandler
} from "./createPgToOpenSearchHandler.js";
export {
    PgToOpenSearchFeature,
    type PgToOpenSearchFeatureConfig
} from "./features/PgToOpenSearchFeature.js";
```

- [ ] **Step 4: Verify build**

```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-sync-pg-to-opensearch 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

---

### Task 4: Tests

**Files:**
- Create: `packages/api-sync-pg-to-opensearch/__tests__/PgOperationsBuilder.test.ts`

**Interfaces:**
- Consumes: `PgOperationsBuilder` from Task 2, `PgWalChangeRecord` from Task 1, `CompressionFeature`, `OperationsFactoryFeature`, `Container`

- [ ] **Step 1: Create PgOperationsBuilder test**

Test that PG sync table rows convert correctly to OS bulk operations. Follow `api-sync-ddb-to-opensearch/__tests__/OperationsBuilder.test.ts` pattern but with PG sync records instead of DDB records.

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch/features/Operations/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { PgOperationsBuilderFeature } from "~/features/PgOperationsBuilder/feature";
import type { PgWalChangeRecord } from "~/types";

describe("PgOperationsBuilder", () => {
    let builder: OperationsBuilder.Interface;
    let compressor: CompressionHandler.Interface;

    beforeEach(() => {
        const container = new Container();
        CompressionFeature.register(container);
        OperationsFactoryFeature.register(container);
        PgOperationsBuilderFeature.register(container);
        builder = container.resolve(OperationsBuilder);
        compressor = container.resolve(CompressionHandler);
    });

    const createRecord = async (
        overrides: Partial<PgWalChangeRecord> & { rawData?: Record<string, unknown> }
    ): Promise<PgWalChangeRecord> => {
        const { rawData, ...rest } = overrides;
        let data = rest.data ?? "";
        if (rawData) {
            const compressed = await compressor.compress(rawData);
            data = compressed.value;
        }
        return {
            id: "entry-1:L",
            entryId: "entry-1",
            index: "test-index",
            operation: "INSERT",
            data,
            tenant: "root",
            ...rest
        };
    };

    it("should build an insert operation", async () => {
        const record = await createRecord({
            rawData: { id: "123", title: "Test" }
        });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(2);
        expect(operations.items).toEqual([
            { index: { _id: "entry-1:L", _index: "test-index" } },
            { id: "123", title: "Test" }
        ]);
    });

    it("should build a delete operation", async () => {
        const record = await createRecord({
            operation: "REMOVE",
            data: ""
        });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(1);
        expect(operations.items).toEqual([
            { delete: { _id: "entry-1:L", _index: "test-index" } }
        ]);
    });

    it("should skip record if missing id", async () => {
        const record = await createRecord({ id: "", rawData: { title: "Test" } });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should skip record if missing index", async () => {
        const record = await createRecord({ index: "", rawData: { title: "Test" } });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should skip INSERT record if missing data", async () => {
        const record = await createRecord({ data: "" });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should handle mixed operations", async () => {
        const insert = await createRecord({
            id: "entry-1:L",
            rawData: { id: "1", title: "Insert" }
        });
        const remove = await createRecord({
            id: "entry-2:P",
            index: "test-index-2",
            operation: "REMOVE"
        });
        const operations = await builder.build({ records: [insert, remove] });
        expect(operations.count).toBe(2);
    });
});
```

- [ ] **Step 2: Run tests**

```bash
yarn test packages/api-sync-pg-to-opensearch 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

---

### Task 5: Pre-commit Checks

- [ ] **Step 1: Run all pre-commit scripts**

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

- [ ] **Step 2: Final commit if any changes**
