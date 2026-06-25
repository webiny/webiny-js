# db-dynamodb DI Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `packages/db-dynamodb` internals into DI features (DynamoDbDocumentClient, DynamoDbTableFactory, DynamoDbEntityFactory, DynamoDbBatchFactory) so consumers resolve factories from DI instead of manually wiring `documentClient` and calling `createTable()`/`createStandardEntity()`.

**Architecture:** Four layered DI abstractions — table factory creates document clients, entity factory creates entities via batch factory delegation. All share one `DynamoDBDocument` connection resolved from the existing `DynamoDBClient` DI abstraction.

**Tech Stack:** TypeScript, `@webiny/di` (`createAbstraction`), `@webiny/feature/api` (`createFeature`), AWS SDK v3 (`@webiny/aws-sdk/client-dynamodb`)

**Spec:** `docs/.bruno/specs/2026-06-25-db-dynamodb-di-features-design.md`

## Global Constraints

- ES modules only (no CommonJS/require)
- One class per file
- One named import per line (one identifier per import statement)
- `import { createAbstraction } from "@webiny/feature/api"` for abstractions
- `createFeature` for internal package feature registration; `Abstraction.createImplementation` for consumer-side wiring
- Namespace pattern: `export namespace Foo { export type Interface = IFoo }`
- No `export default` — always named exports
- No `??` or `??=` operators — use `||` and explicit if-checks
- No JSDoc-style `/** */` — use `/* */` for multi-line comments
- Comments end with period
- Class properties always use `public`/`protected`/`private` + `readonly` where applicable
- Run full before-commit checklist after code changes
- Existing 203 tests in `packages/db-dynamodb` must keep passing throughout

---

### Task 1: Create DynamoDbDocumentClient feature

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbDocumentClient/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbDocumentClient/DynamoDbDocumentClient.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `IDynamoDbDocumentClient` interface, `DynamoDbDocumentClient` namespace, `DynamoDbDocumentClient` class, `IQueryParams`, `IQueryPageResponse`, `IScanParams`, `IScanResponse` types

This task creates NEW files alongside the existing `utils/DynamoDocClient.ts`. No existing code is modified — the old file stays until Task 5.

- [ ] **Step 1: Create `abstractions.ts`**

This file holds the interface, namespace, and all supporting query/scan param types. Extract the type definitions from the current `utils/DynamoDocClient.ts` (lines 1-76). The interface must match the public API of the existing `DynamoDocClient` class exactly.

```typescript
/* packages/db-dynamodb/src/features/DynamoDbDocumentClient/abstractions.ts */

import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IKeyAttributes {
    pk: string;
    sk?: string;
}

export interface IQueryParams {
    partitionKey: string;
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
    eq?: string | number;
    lt?: string | number;
    lte?: string | number;
    gt?: string | number;
    gte?: string | number;
    between?: [string, string] | [number, number] | [bigint, bigint];
    beginsWith?: string;
    startKey?: GenericRecord;
    filters?: GenericRecord;
    attributes?: string[];
}

export interface IQueryPageResponse<T> {
    items: T[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IScanParams {
    index?: string;
    limit?: number;
    startKey?: GenericRecord;
    segment?: number;
    totalSegments?: number;
    filters?: GenericRecord;
    consistent?: boolean;
}

export interface IScanResponse<T> {
    items: T[];
    count?: number;
    scannedCount?: number;
    lastEvaluatedKey?: GenericRecord;
    requestId: string;
    error: Error | null;
    next?: () => Promise<IScanResponse<T>>;
}

export interface IDynamoDbDocumentClient {
    getTableName(): string;
    getDocumentClient(): DynamoDBDocument;

    get<T>(keys: GenericRecord): Promise<T | null>;
    put<T extends GenericRecord>(item: T): Promise<void>;
    delete(keys: GenericRecord): Promise<void>;

    query<T>(params: IQueryParams): Promise<T[]>;
    queryPage<T>(params: IQueryParams): Promise<IQueryPageResponse<T>>;
    queryOne<T>(params: IQueryParams): Promise<T | null>;

    scan<T>(params?: IScanParams): Promise<IScanResponse<T>>;

    batchGet<T>(keys: GenericRecord[], maxChunk?: number): Promise<T[]>;
    batchWrite(items: Array<Record<string, any>>, maxChunk?: number): Promise<void>;
}

export namespace DynamoDbDocumentClient {
    export type Interface = IDynamoDbDocumentClient;
}
```

Look at the existing `utils/DynamoDocClient.ts` to verify you have all the type definitions. The interface here must list every public method from that class.

- [ ] **Step 2: Create `DynamoDbDocumentClient.ts`**

Copy the class from `utils/DynamoDocClient.ts` — rename the class from `DynamoDocClient` to `DynamoDbDocumentClient`. Update it to implement `IDynamoDbDocumentClient`. Import types from `./abstractions.js` instead of defining them inline. All method signatures and logic stay identical.

```typescript
/* packages/db-dynamodb/src/features/DynamoDbDocumentClient/DynamoDbDocumentClient.ts */

import type {
    IDynamoDbDocumentClient,
    IQueryParams,
    IQueryPageResponse,
    IScanParams,
    IScanResponse
} from "./abstractions.js";
/* ... AWS SDK imports ... */

export interface IDynamoDbDocumentClientParams {
    documentClient: DynamoDBDocument;
    tableName: string;
}

export class DynamoDbDocumentClient implements IDynamoDbDocumentClient {
    /* Exact same implementation as current DynamoDocClient class. */
    /* Rename class only, no logic changes. */
}
```

The full implementation is ~430 lines — copy it verbatim from `utils/DynamoDocClient.ts`, replacing class name and import paths only.

- [ ] **Step 3: Verify the build compiles**

The new files are standalone — nothing imports them yet. Run:

```bash
yarn build -p @webiny/db-dynamodb 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbDocumentClient/
git commit -m "feat(db-dynamodb): create DynamoDbDocumentClient feature files"
```

---

### Task 2: Create DynamoDbBatchFactory feature

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/DynamoDbBatchFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/feature.ts`

**Interfaces:**
- Consumes: `DynamoDbDocumentClient.Interface` from Task 1, `EntitySchema` from `utils/EntitySchema.ts`, batch types from `utils/batch/types.ts`, `utils/entity/types.ts`
- Produces: `IDynamoDbBatchFactory`, `DynamoDbBatchFactory` abstraction token, `DynamoDbBatchFactoryFeature`

- [ ] **Step 1: Create `abstractions.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbBatchFactory/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type {
    IPutBatchItem,
    IDeleteBatchItem,
    IReadBatchItem
} from "~/utils/batch/types.js";
import type {
    IEntityWriteBatch,
    IEntityReadBatch
} from "~/utils/entity/types.js";
import type {
    ITableWriteBatch,
    ITableReadBatch
} from "~/utils/table/types.js";

export interface IDynamoDbBatchFactoryCreateEntityWriterParams<T = GenericRecord> {
    schema: EntitySchema;
    client: DynamoDbDocumentClient.Interface;
    put?: IPutBatchItem<T>[];
    delete?: IDeleteBatchItem[];
}

export interface IDynamoDbBatchFactoryCreateEntityReaderParams {
    schema: EntitySchema;
    client: DynamoDbDocumentClient.Interface;
    read?: IReadBatchItem[];
}

export interface IDynamoDbBatchFactoryCreateTableWriterParams {
    client: DynamoDbDocumentClient.Interface;
}

export interface IDynamoDbBatchFactoryCreateTableReaderParams {
    client: DynamoDbDocumentClient.Interface;
}

export interface IDynamoDbBatchFactory {
    createEntityWriter<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityWriterParams<T>
    ): IEntityWriteBatch<T>;

    createEntityReader<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityReaderParams
    ): IEntityReadBatch<T>;

    createTableWriter(
        params: IDynamoDbBatchFactoryCreateTableWriterParams
    ): ITableWriteBatch;

    createTableReader(
        params: IDynamoDbBatchFactoryCreateTableReaderParams
    ): ITableReadBatch;
}

export const DynamoDbBatchFactory = createAbstraction<IDynamoDbBatchFactory>(
    "Db/DynamoDB/DynamoDbBatchFactory"
);

export namespace DynamoDbBatchFactory {
    export type Interface = IDynamoDbBatchFactory;
}
```

Note: this imports from `~/utils/table/types.js` which still defines `ITableWriteBatch` and `ITableReadBatch`. These types stay in that file (only `ITable` gets removed later in Task 5).

- [ ] **Step 2: Create `DynamoDbBatchFactory.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbBatchFactory/DynamoDbBatchFactory.ts */

import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IDynamoDbBatchFactory,
    IDynamoDbBatchFactoryCreateEntityWriterParams,
    IDynamoDbBatchFactoryCreateEntityReaderParams,
    IDynamoDbBatchFactoryCreateTableWriterParams,
    IDynamoDbBatchFactoryCreateTableReaderParams
} from "./abstractions.js";
import type {
    IEntityWriteBatch,
    IEntityReadBatch
} from "~/utils/entity/types.js";
import type {
    ITableWriteBatch,
    ITableReadBatch
} from "~/utils/table/types.js";
import { createEntityWriteBatch } from "~/utils/entity/EntityWriteBatch.js";
import { createEntityReadBatch } from "~/utils/entity/EntityReadBatch.js";
import { createTableWriteBatch } from "~/utils/table/TableWriteBatch.js";
import { createTableReadBatch } from "~/utils/table/TableReadBatch.js";

export class DynamoDbBatchFactoryImpl implements IDynamoDbBatchFactory {
    public createEntityWriter<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityWriterParams<T>
    ): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            schema: params.schema,
            client: params.client,
            put: params.put,
            delete: params.delete
        });
    }

    public createEntityReader<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityReaderParams
    ): IEntityReadBatch<T> {
        return createEntityReadBatch({
            schema: params.schema,
            client: params.client,
            read: params.read
        });
    }

    public createTableWriter(
        params: IDynamoDbBatchFactoryCreateTableWriterParams
    ): ITableWriteBatch {
        return createTableWriteBatch({ table: params.client });
    }

    public createTableReader(
        params: IDynamoDbBatchFactoryCreateTableReaderParams
    ): ITableReadBatch {
        return createTableReadBatch({ table: params.client });
    }
}
```

Note: this will have type errors until Task 5 updates the batch params from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`. That's expected — the new files compile once the internal rewiring happens.

- [ ] **Step 3: Create `feature.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbBatchFactory/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { DynamoDbBatchFactory } from "./abstractions.js";
import { DynamoDbBatchFactoryImpl } from "./DynamoDbBatchFactory.js";

export const DynamoDbBatchFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbBatchFactoryFeature",
    register(container) {
        container.registerInstance(
            DynamoDbBatchFactory,
            new DynamoDbBatchFactoryImpl()
        );
    }
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbBatchFactory/
git commit -m "feat(db-dynamodb): create DynamoDbBatchFactory feature files"
```

---

### Task 3: Create DynamoDbEntityFactory feature

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/attributes.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/DynamoDbEntityFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/feature.ts`

**Interfaces:**
- Consumes: `DynamoDbDocumentClient.Interface` (Task 1), `DynamoDbBatchFactory` (Task 2), `Entity` class from `utils/entity/Entity.ts`, `AttributeDefinitions` from `utils/EntitySchema.ts`
- Produces: `IDynamoDbEntityFactory`, `DynamoDbEntityFactory` abstraction token, `DynamoDbEntityFactoryFeature`, `standardEntityAttributes`, `globalEntityAttributes`, `IStandardEntityAttributes`, `IGlobalEntityAttributes`

- [ ] **Step 1: Create `attributes.ts`**

Move the attribute constants and types from `utils/createEntity.ts`. This is a copy — the old file stays until Task 5.

```typescript
/* packages/db-dynamodb/src/features/DynamoDbEntityFactory/attributes.ts */

import type { AttributeDefinitions } from "~/utils/EntitySchema.js";

export type IGlobalEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: number | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const globalEntityAttributes: AttributeDefinitions = {
    PK: { partitionKey: true },
    SK: { sortKey: true },
    GSI1_PK: { type: "string" },
    GSI1_SK: { type: "string" },
    GSI2_PK: { type: "string" },
    GSI2_SK: { type: "string" },
    TYPE: { type: "string", required: true },
    data: { type: "map" },
    expiresAt: { type: "number" }
};

export type IStandardEntityAttributes<T = undefined> = {
    PK: string;
    SK: string;
    GSI_TENANT: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    GSI2_PK?: string;
    GSI2_SK?: string;
    expiresAt?: number | null;
} & (T extends undefined ? { data?: undefined } : { data: T });

export const standardEntityAttributes: AttributeDefinitions = {
    PK: { partitionKey: true },
    SK: { sortKey: true },
    GSI_TENANT: { type: "string", required: true },
    GSI1_PK: { type: "string" },
    GSI1_SK: { type: "string" },
    GSI2_PK: { type: "string" },
    GSI2_SK: { type: "string" },
    TYPE: { type: "string", required: true },
    data: { type: "map" },
    expiresAt: { type: "number" }
};
```

Copy these exactly from `utils/createEntity.ts` — verify against the current file.

- [ ] **Step 2: Create `abstractions.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbEntityFactory/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { AttributeDefinitions } from "~/utils/EntitySchema.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { IEntity } from "~/utils/entity/types.js";

export {
    standardEntityAttributes,
    globalEntityAttributes,
    type IStandardEntityAttributes,
    type IGlobalEntityAttributes
} from "./attributes.js";

export interface IDynamoDbEntityFactoryCreateParams {
    name: string;
    attributes: AttributeDefinitions;
    client: DynamoDbDocumentClient.Interface;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactoryCreateStandardParams {
    name: string;
    client: DynamoDbDocumentClient.Interface;
    attributes?: AttributeDefinitions;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactoryCreateGlobalParams {
    name: string;
    client: DynamoDbDocumentClient.Interface;
    attributes?: AttributeDefinitions;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactory {
    create<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateParams
    ): IEntity<T>;

    createStandard<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateStandardParams
    ): IEntity<IStandardEntityAttributes<T>>;

    createGlobal<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateGlobalParams
    ): IEntity<IGlobalEntityAttributes<T>>;
}

export const DynamoDbEntityFactory = createAbstraction<IDynamoDbEntityFactory>(
    "Db/DynamoDB/DynamoDbEntityFactory"
);

export namespace DynamoDbEntityFactory {
    export type Interface = IDynamoDbEntityFactory;
}
```

- [ ] **Step 3: Create `DynamoDbEntityFactory.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbEntityFactory/DynamoDbEntityFactory.ts */

import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IDynamoDbEntityFactory,
    IDynamoDbEntityFactoryCreateParams,
    IDynamoDbEntityFactoryCreateStandardParams,
    IDynamoDbEntityFactoryCreateGlobalParams,
    IStandardEntityAttributes,
    IGlobalEntityAttributes
} from "./abstractions.js";
import {
    standardEntityAttributes,
    globalEntityAttributes
} from "./attributes.js";
import type { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
import type { IEntity } from "~/utils/entity/types.js";
import { Entity } from "~/utils/entity/Entity.js";

export class DynamoDbEntityFactoryImpl implements IDynamoDbEntityFactory {
    public constructor(
        private readonly batchFactory: DynamoDbBatchFactory.Interface
    ) {}

    public create<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateParams
    ): IEntity<T> {
        return new Entity<T>(
            {
                name: params.name,
                attributes: params.attributes,
                table: params.client,
                timestamps: params.timestamps
            },
            this.batchFactory
        );
    }

    public createStandard<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateStandardParams
    ): IEntity<IStandardEntityAttributes<T>> {
        return this.create({
            ...params,
            attributes: { ...standardEntityAttributes, ...params.attributes }
        });
    }

    public createGlobal<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateGlobalParams
    ): IEntity<IGlobalEntityAttributes<T>> {
        return this.create({
            ...params,
            attributes: { ...globalEntityAttributes, ...params.attributes }
        });
    }
}
```

Note: `Entity` constructor will need a second `batchFactory` param — that's added in Task 5. Until then this file has a type error, which is expected.

- [ ] **Step 4: Create `feature.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbEntityFactory/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { DynamoDbEntityFactory } from "./abstractions.js";
import { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
import { DynamoDbEntityFactoryImpl } from "./DynamoDbEntityFactory.js";

export const DynamoDbEntityFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbEntityFactoryFeature",
    register(container) {
        const batchFactory = container.resolve(DynamoDbBatchFactory);
        container.registerInstance(
            DynamoDbEntityFactory,
            new DynamoDbEntityFactoryImpl(batchFactory)
        );
    }
});
```

- [ ] **Step 5: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbEntityFactory/
git commit -m "feat(db-dynamodb): create DynamoDbEntityFactory feature files"
```

---

### Task 4: Create DynamoDbTableFactory feature

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/DynamoDbTableFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/feature.ts`

**Interfaces:**
- Consumes: `DynamoDbDocumentClient` class (Task 1), `DynamoDBClient` abstraction from existing `feature/DynamoDBClient/`
- Produces: `IDynamoDbTableFactory`, `DynamoDbTableFactory` abstraction token, `DynamoDbTableFactoryFeature`

- [ ] **Step 1: Create `abstractions.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbTableFactory/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

export interface IDynamoDbTableFactoryCreateParams {
    name: string;
    indexes?: Record<string, { partitionKey: string; sortKey?: string }>;
}

export interface IDynamoDbTableFactory {
    create(params: IDynamoDbTableFactoryCreateParams): DynamoDbDocumentClient.Interface;
}

export const DynamoDbTableFactory = createAbstraction<IDynamoDbTableFactory>(
    "Db/DynamoDB/DynamoDbTableFactory"
);

export namespace DynamoDbTableFactory {
    export type Interface = IDynamoDbTableFactory;
}
```

- [ ] **Step 2: Create `DynamoDbTableFactory.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbTableFactory/DynamoDbTableFactory.ts */

import type { IDynamoDbTableFactory, IDynamoDbTableFactoryCreateParams } from "./abstractions.js";
import type { DynamoDbDocumentClient as DynamoDbDocumentClientAbstraction } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { DynamoDBClient } from "~/feature/DynamoDBClient/abstractions.js";
import { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/DynamoDbDocumentClient.js";

export class DynamoDbTableFactoryImpl implements IDynamoDbTableFactory {
    public constructor(
        private readonly dynamoDBClient: DynamoDBClient.Interface
    ) {}

    public create(params: IDynamoDbTableFactoryCreateParams): DynamoDbDocumentClientAbstraction.Interface {
        return new DynamoDbDocumentClient({
            documentClient: this.dynamoDBClient.client,
            tableName: params.name
        });
    }
}
```

Note: the `DynamoDBClient` import path is `~/feature/DynamoDBClient/abstractions.js` (singular `feature/`) — this will be updated to `~/features/` after Task 5 moves the folders.

- [ ] **Step 3: Create `feature.ts`**

```typescript
/* packages/db-dynamodb/src/features/DynamoDbTableFactory/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { DynamoDbTableFactory } from "./abstractions.js";
import { DynamoDBClient } from "~/feature/DynamoDBClient/abstractions.js";
import { DynamoDbTableFactoryImpl } from "./DynamoDbTableFactory.js";

export const DynamoDbTableFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbTableFactoryFeature",
    register(container) {
        const dynamoDBClient = container.resolve(DynamoDBClient);
        container.registerInstance(
            DynamoDbTableFactory,
            new DynamoDbTableFactoryImpl(dynamoDBClient)
        );
    }
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbTableFactory/
git commit -m "feat(db-dynamodb): create DynamoDbTableFactory feature files"
```

---

### Task 5: Internal rewiring — update Entity, utils, move folders, wire registration, delete old files

**Depends on:** Tasks 1-4 (all feature files must exist)

This is the atomic switch for `packages/db-dynamodb`. All changes happen together because they're tightly coupled within the package.

**Files:**
- Modify: `utils/entity/Entity.ts` — add `batchFactory` param, add `createTableReader()`
- Modify: `utils/entity/types.ts` — change `IEntity.client` type, add `createTableReader()`, add `ITableReadBatch` import
- Modify: `utils/entity/EntityWriteBatch.ts` — change `client` type
- Modify: `utils/entity/EntityReadBatch.ts` — change `client` type
- Modify: `utils/table/TableWriteBatch.ts` — change `table` type
- Modify: `utils/table/TableReadBatch.ts` — change `table` type
- Modify: `utils/table/types.ts` — remove `ITable`, update imports
- Modify: `utils/put.ts`, `get.ts`, `delete.ts`, `query.ts`, `scan.ts`, `cleanup.ts`, `count.ts` — change `client`/`table` types
- Modify: `utils/batch/batchWrite.ts`, `utils/batch/batchRead.ts` — change `table`/`client` types
- Modify: `utils/entity/index.ts`, `utils/table/index.ts`, `utils/index.ts` — update re-exports
- Modify: `store/entity.ts` — switch from `ITable`/`createGlobalEntity` to new types
- Modify: `toolbox.ts` — update `TableDef`, `EntityConstructor.table` type
- Modify: `index.ts` — update imports, add new feature registrations
- Modify: `exports/api/db.ts` — add new abstraction exports
- Move: `feature/DynamoDBClient/` → `features/DynamoDBClient/`
- Move: `feature/FilterUtil/` → `features/FilterUtil/`
- Move: `feature/ValueFilter/` → `features/ValueFilter/`
- Delete: `utils/DynamoDocClient.ts`
- Delete: `utils/createTable.ts`
- Delete: `utils/createEntity.ts`
- Delete: `utils/entity/getEntity.ts`
- Delete: `utils/table/Table.ts`

**Interfaces:**
- Consumes: all 4 feature modules from Tasks 1-4
- Produces: updated `IEntity` (with `DynamoDbDocumentClient.Interface` client type), updated `registerDynamoDBCore()`, updated exports

- [ ] **Step 1: Move `feature/` → `features/`**

```bash
git mv packages/db-dynamodb/src/feature/DynamoDBClient packages/db-dynamodb/src/features/DynamoDBClient
git mv packages/db-dynamodb/src/feature/FilterUtil packages/db-dynamodb/src/features/FilterUtil
git mv packages/db-dynamodb/src/feature/ValueFilter packages/db-dynamodb/src/features/ValueFilter
rmdir packages/db-dynamodb/src/feature
```

Update all internal import paths within the moved files from `~/feature/` to `~/features/`. Also update the `DynamoDbTableFactory` files (Task 4) which import from `~/feature/DynamoDBClient/`.

- [ ] **Step 2: Update all internal utils — replace `DynamoDocClient` type references**

In every file listed below, change:
- `import type { DynamoDocClient } from "~/utils/DynamoDocClient.js"` → `import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js"`
- Property/param types: `DynamoDocClient` → `DynamoDbDocumentClient.Interface`
- `import type { IScanParams, IScanResponse } from "~/utils/DynamoDocClient.js"` → `import type { IScanParams, IScanResponse } from "~/features/DynamoDbDocumentClient/abstractions.js"`

Files to update:
- `utils/put.ts`
- `utils/get.ts`
- `utils/delete.ts`
- `utils/query.ts`
- `utils/scan.ts`
- `utils/cleanup.ts`
- `utils/count.ts`
- `utils/batch/batchWrite.ts`
- `utils/batch/batchRead.ts`
- `utils/entity/EntityWriteBatch.ts`
- `utils/entity/EntityReadBatch.ts`
- `utils/entity/EntityWriteBatchBuilder.ts` (if it imports DynamoDocClient)
- `utils/entity/EntityReadBatchBuilder.ts` (if it imports DynamoDocClient)
- `utils/table/TableWriteBatch.ts`
- `utils/table/TableReadBatch.ts`
- `utils/table/types.ts`

- [ ] **Step 3: Update `utils/table/types.ts` — remove `ITable`**

Remove the `ITable` interface. Keep `ITableWriteBatch`, `ITableReadBatch`, `ITableReadBatchKey`, `ITableReadBatchBuilderGetResponse`, `ITableScanParams`, `ITableScanResponse`. Update imports from `DynamoDocClient` to `DynamoDbDocumentClient`.

- [ ] **Step 4: Update `utils/entity/types.ts` — change `IEntity.client` type, add `createTableReader()`**

```typescript
/* Change this import: */
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

/* In IEntity interface: */
export interface IEntity<T extends GenericRecord = GenericRecord> {
    readonly schema: EntitySchema;
    readonly client: DynamoDbDocumentClient.Interface;  /* was DynamoDocClient */
    readonly name: string;
    createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T>;
    createEntityWriter(params?: IEntityCreateEntityWriterParams<T>): IEntityWriteBatch<T>;
    createTableWriter(): ITableWriteBatch;
    createTableReader(): ITableReadBatch;  /* NEW */
    put(item: IPutParamsItem<T>): Promise<void>;
    get<R extends T = T>(keys: GetRecordParamsKeys): Promise<R | null>;
    getClean<R extends T = T>(keys: GetRecordParamsKeys): Promise<R | null>;
    delete(keys: IDeleteItemKeys): Promise<void>;
    queryOne<R extends T = T>(params: IEntityQueryOneParams): Promise<R | null>;
    queryOneClean<R extends T = T>(params: IEntityQueryOneParams): Promise<R | null>;
    queryAll<R extends T = T>(params: IEntityQueryAllParams): Promise<R[]>;
    queryAllClean<R extends T = T>(params: IEntityQueryAllParams): Promise<R[]>;
    queryPerPage<R extends T = T>(params: IEntityQueryPerPageParams): Promise<IQueryPageResponse<R>>;
}
```

Add `ITableReadBatch` to the imports from `~/utils/table/types.js`.

- [ ] **Step 5: Update `utils/entity/Entity.ts` — add `batchFactory` param, add `createTableReader()`**

Add `DynamoDbBatchFactory.Interface` as second constructor parameter. Replace direct batch creation calls with factory delegation. Add `createTableReader()` method. Change `DynamoDocClient` import to `DynamoDbDocumentClient`.

See the spec's "Entity Class Update" section for the exact implementation.

- [ ] **Step 6: Update `toolbox.ts`**

```typescript
/* packages/db-dynamodb/src/toolbox.ts */

export type {
    DynamoDBTypes,
    AttributeDefinition,
    AttributeDefinitions
} from "~/utils/EntitySchema.js";

export type { IDynamoDbDocumentClient as TableDef } from "~/features/DynamoDbDocumentClient/abstractions.js";

import type { AttributeDefinitions } from "~/utils/EntitySchema.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

export type Readonly<T> = T extends ((...args: any[]) => any) | undefined
    ? T
    : T extends object
      ? { readonly [P in keyof T]: Readonly<T[P]> }
      : T;

export interface EntityConstructor<
    T extends Readonly<AttributeDefinitions> = Readonly<AttributeDefinitions>
> {
    name: string;
    attributes: T;
    table?: DynamoDbDocumentClient.Interface;
    timestamps?: boolean;
}

export interface EntityQueryOptions {
    /* ... keep as-is ... */
}

export type ScanOptions = {
    /* ... keep as-is ... */
};
```

Remove `TableConstructor` interface (only used by deleted `Table` class and `createTable`).

- [ ] **Step 7: Update `store/entity.ts`**

```typescript
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { DynamoDbEntityFactory } from "~/features/DynamoDbEntityFactory/abstractions.js";
import type { IStoreEntity, IStoreEntityValue } from "~/store/types.js";

export interface ICreateEntityParams {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}

export const createEntity = ({ client, entityFactory }: ICreateEntityParams): IStoreEntity => {
    return entityFactory.createGlobal<IStoreEntityValue>({
        client,
        name: "WebinyKeyValue"
    });
};
```

Check how `createEntity` is called in `DynamoDbDriver.ts` and update the call site to pass the new params.

- [ ] **Step 8: Update `utils/index.ts` — remove deleted re-exports**

Remove re-exports of `createEntity.ts`, `createTable.ts`. Keep everything else. Remove `getEntity` from entity re-exports.

- [ ] **Step 9: Update `index.ts` — add new feature registrations**

```typescript
import { DynamoDbBatchFactoryFeature } from "~/features/DynamoDbBatchFactory/feature.js";
import { DynamoDbEntityFactoryFeature } from "~/features/DynamoDbEntityFactory/feature.js";
import { DynamoDbTableFactoryFeature } from "~/features/DynamoDbTableFactory/feature.js";
import { DynamoDBClientFeature } from "~/features/DynamoDBClient/index.js";
import { FilterUtilFeature } from "~/features/FilterUtil/index.js";

/* ... in registerDynamoDBCore: */
DynamoDBClientFeature.register(context.container, documentClient);
DynamoDbBatchFactoryFeature.register(context.container);
DynamoDbEntityFactoryFeature.register(context.container);
DynamoDbTableFactoryFeature.register(context.container);
FilterUtilFeature.register(context.container);
ValueFilterFeature.register(context.container);
```

Also update the `DynamoDBClient` export path and add new factory exports.

- [ ] **Step 10: Update `exports/api/db.ts`**

```typescript
export { DynamoDBClient } from "~/features/DynamoDBClient/index.js";
export {
    DynamoDbDocumentClient,
    type IScanParams,
    type IScanResponse,
    type IQueryParams,
    type IQueryPageResponse
} from "~/features/DynamoDbDocumentClient/abstractions.js";
export { DynamoDbTableFactory } from "~/features/DynamoDbTableFactory/abstractions.js";
export {
    DynamoDbEntityFactory,
    standardEntityAttributes,
    globalEntityAttributes,
    type IStandardEntityAttributes,
    type IGlobalEntityAttributes
} from "~/features/DynamoDbEntityFactory/abstractions.js";
export { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
export { ValueFilter, ValueFilterRegistry } from "~/features/ValueFilter/index.js";
export { FilterUtil } from "~/features/FilterUtil/index.js";
```

- [ ] **Step 11: Delete old files**

```bash
rm packages/db-dynamodb/src/utils/DynamoDocClient.ts
rm packages/db-dynamodb/src/utils/createTable.ts
rm packages/db-dynamodb/src/utils/createEntity.ts
rm packages/db-dynamodb/src/utils/entity/getEntity.ts
rm packages/db-dynamodb/src/utils/table/Table.ts
```

- [ ] **Step 12: Run tests**

```bash
yarn test packages/db-dynamodb 2>&1 | tail -30
```

Expected: all 203 tests pass. Some tests may need import path updates if they imported from deleted files.

- [ ] **Step 13: Run before-commit checklist and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "refactor(db-dynamodb): wire DI features, delete old utils"
```

---

### Task 6: Migrate `webiny` package re-exports

**Depends on:** Task 5

**Files:**
- Modify: `packages/webiny/src/api/db.ts`

**Interfaces:**
- Consumes: updated export paths from `@webiny/db-dynamodb`
- Produces: updated re-exports for downstream consumers

- [ ] **Step 1: Update import paths**

```typescript
/* packages/webiny/src/api/db.ts */
export { DbRegistry, DbRegistryFeature } from "@webiny/db/features/DbRegistry/index.js";
export { DynamoDBClient } from "@webiny/db-dynamodb/features/DynamoDBClient/index.js";
export { ValueFilter, ValueFilterRegistry } from "@webiny/db-dynamodb/features/ValueFilter/index.js";
export { FilterUtil } from "@webiny/db-dynamodb/features/FilterUtil/index.js";
```

Change `feature/` → `features/` in all three `@webiny/db-dynamodb` import paths.

- [ ] **Step 2: Build and commit**

```bash
yarn build -p @webiny/webiny 2>&1 | tail -5
git add packages/webiny/src/api/db.ts
git commit -m "refactor(webiny): update db-dynamodb import paths to features/"
```

---

### Task 7: Migrate `api-core-ddb`

**Depends on:** Task 5

**Files:**
- Modify: `packages/api-core-ddb/src/tenancy/index.ts`
- Modify: `packages/api-core-ddb/src/tenancy/definitions/tenantEntity.ts`
- Modify: `packages/api-core-ddb/src/security/index.ts`
- Modify: `packages/api-core-ddb/src/security/definitions/entities.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/index.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/definitions/entities.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/types.ts`
- Modify: `packages/api-core-ddb/src/keyValueStore/KeyValueStoreDynamoTable.ts`

**Interfaces:**
- Consumes: `DynamoDbTableFactory`, `DynamoDbEntityFactory` from `@webiny/db-dynamodb/exports/api/db.js`
- Produces: updated consumer code using DI factories instead of `createTable`/`createStandardEntity`

- [ ] **Step 1: Update entity definition files**

Replace `import { createStandardEntity } from "@webiny/db-dynamodb"` and `import type { TableDef } from "@webiny/db-dynamodb/toolbox.js"` patterns.

Entity definition files (`tenantEntity.ts`, `entities.ts`) currently take a `TableDef` param and call `createStandardEntity({ table, name })`. Change them to take `DynamoDbDocumentClient.Interface` + `DynamoDbEntityFactory.Interface` and call `entityFactory.createStandard({ client, name })`.

- [ ] **Step 2: Update index files**

Files like `tenancy/index.ts`, `security/index.ts`, `adminUsers/index.ts` currently call `createTable({ documentClient, name })`. Replace with `tableFactory.create({ name })` using the resolved `DynamoDbTableFactory`.

Update their constructor dependencies from `DynamoDBClient` to `DynamoDbTableFactory` + `DynamoDbEntityFactory`.

- [ ] **Step 3: Update `adminUsers/types.ts`**

Change `getTable(): ITable` return type to `DynamoDbDocumentClient.Interface`.

- [ ] **Step 4: Update `keyValueStore/KeyValueStoreDynamoTable.ts`**

Replace `createTable` + `createGlobalEntity` with factory calls.

- [ ] **Step 5: Build and test**

```bash
yarn build -p @webiny/api-core-ddb 2>&1 | tail -5
yarn test packages/api-core-ddb 2>&1 | tail -30
```

- [ ] **Step 6: Run before-commit checklist and commit**

```bash
git add packages/api-core-ddb/
git commit -m "refactor(api-core-ddb): migrate to DI factory abstractions"
```

---

### Task 8: Migrate `api-headless-cms-ddb`

**Depends on:** Task 5

**Files:**
- Modify: `packages/api-headless-cms-ddb/src/definitions/entry.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/group.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/model.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/table.ts`
- Modify: `packages/api-headless-cms-ddb/src/types.ts`
- Modify: `packages/api-headless-cms-ddb/src/index.ts`

Same pattern as Task 7: replace `createTable`/`createStandardEntity` with factory calls, update `getTable()` return type from `ITable` to `DynamoDbDocumentClient.Interface`.

- [ ] **Step 1: Update definitions**

Replace `createTable`, `createStandardEntity` with `DynamoDbTableFactory.create()`, `DynamoDbEntityFactory.createStandard()`.

- [ ] **Step 2: Update `types.ts`**

Change `getTable: () => ITable` to `getTable: () => DynamoDbDocumentClient.Interface`.

- [ ] **Step 3: Update `index.ts`**

Update DI dependencies.

- [ ] **Step 4: Build and test**

```bash
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -5
yarn test packages/api-headless-cms-ddb 2>&1 | tail -30
```

- [ ] **Step 5: Run before-commit checklist and commit**

```bash
git add packages/api-headless-cms-ddb/
git commit -m "refactor(api-headless-cms-ddb): migrate to DI factory abstractions"
```

---

### Task 9: Migrate `api-headless-cms-ddb-es`

**Depends on:** Task 5

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/entry.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/group.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/model.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/feature.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/types.ts`
- Modify: `packages/api-headless-cms-ddb-es/__tests__/graphql/handler.ts`

Same pattern. Also update `getTable()` / `getEsTable()` return types.

- [ ] **Step 1-4: Same pattern as Task 8**

Update definitions, types, feature, test handler. Replace `createTable`/`createStandardEntity` with factory calls.

- [ ] **Step 5: Run before-commit checklist and commit**

```bash
git add packages/api-headless-cms-ddb-es/
git commit -m "refactor(api-headless-cms-ddb-es): migrate to DI factory abstractions"
```

---

### Task 10: Migrate `api-opensearch` + `api-elasticsearch-tasks`

**Depends on:** Task 5

**Files:**
- Modify: `packages/api-opensearch/src/db/table.ts`
- Modify: `packages/api-opensearch/src/db/entity.ts`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/Manager.ts`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/reindexing/ReindexingTaskRunner.ts`
- Modify: `packages/api-elasticsearch-tasks/src/helpers/scan.ts`

Special cases:
- `ElasticsearchSynchronize.ts` imports `Entity` class directly — switch to `DynamoDbEntityFactory`
- `scan.ts` uses `TableDef` type — update to `DynamoDbDocumentClient.Interface`

- [ ] **Steps: Update all files, build, test, commit**

```bash
git add packages/api-opensearch/ packages/api-elasticsearch-tasks/
git commit -m "refactor(api-opensearch, api-elasticsearch-tasks): migrate to DI factory abstractions"
```

---

### Task 11: Migrate remaining consumers

**Depends on:** Task 5

**Files:**
- Modify: `packages/api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts`
- Modify: `packages/api-audit-logs-ddb/src/entity.ts`
- Modify: `packages/api-audit-logs-ddb/src/Storage.ts`
- Modify: `packages/api-websockets-ddb/src/entity.ts`
- Modify: `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`
- Modify: `packages/api-file-manager/__tests__/utils/scanTable.ts`

Special cases:
- `api-audit-logs-ddb` uses `ReturnType<typeof createTable>` — replace with `DynamoDbDocumentClient.Interface`
- `api-audit-logs-ddb` uses dynamic GSI count — use `tableFactory.create({ name, indexes: createTableGSIIndexes(gsiAmount) })`
- `api-file-manager` test util imports `IScanParams` from deleted path — update import to `@webiny/db-dynamodb/exports/api/db.js`

- [ ] **Steps: Update all files, build, test, commit**

```bash
git add packages/api-aco-ddb/ packages/api-audit-logs-ddb/ packages/api-websockets-ddb/ packages/api-file-manager/
git commit -m "refactor: migrate remaining consumers to DI factory abstractions"
```

---

### Task 12: Full build + test verification

**Depends on:** Tasks 6-11

- [ ] **Step 1: Full monorepo build**

```bash
yarn build 2>&1 | tail -30
```

Expected: all 126 packages build successfully.

- [ ] **Step 2: Run db-dynamodb tests**

```bash
yarn test packages/db-dynamodb 2>&1 | tail -30
```

Expected: all 203 tests pass.

- [ ] **Step 3: Run consumer package tests**

```bash
yarn test packages/api-core-ddb 2>&1 | tail -30
yarn test packages/api-headless-cms-ddb 2>&1 | tail -30
```

- [ ] **Step 4: Verify no remaining references to deleted symbols**

```bash
grep -rn "createTable\b\|createStandardEntity\|createGlobalEntity\|DynamoDocClient\b" packages/*/src/ --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v features/DynamoDbDocumentClient
```

Expected: no matches (only test files and the new feature files should remain).

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add .
git commit -m "chore: final cleanup after DI features migration"
```
