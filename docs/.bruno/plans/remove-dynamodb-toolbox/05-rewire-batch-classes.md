# Task 5: Rewire batch classes

**Files:**
- Modify: `packages/db-dynamodb/src/utils/entity/EntityReadBatch.ts`
- Modify: `packages/db-dynamodb/src/utils/entity/EntityReadBatchBuilder.ts`
- Modify: `packages/db-dynamodb/src/utils/entity/EntityWriteBatch.ts`
- Modify: `packages/db-dynamodb/src/utils/entity/EntityWriteBatchBuilder.ts`
- Modify: `packages/db-dynamodb/src/utils/batch/batchRead.ts`
- Modify: `packages/db-dynamodb/src/utils/batch/batchWrite.ts`
- Modify: `packages/db-dynamodb/src/utils/batch/types.ts`
- Modify: `packages/db-dynamodb/src/utils/table/TableReadBatch.ts`
- Modify: `packages/db-dynamodb/src/utils/table/TableWriteBatch.ts`

**Interfaces:**
- Consumes: `DynamoDocClient` from Task 1, `EntitySchema` from Task 2
- Produces: Batch classes that use `DynamoDocClient.batchGet`/`DynamoDocClient.batchWrite` + `EntitySchema.toPutRequest`/`toDeleteRequest`/`toGetKeys` instead of dynamodb-toolbox's `entity.putBatch`/`entity.deleteBatch`/`entity.getBatch`/`table.batchGet`/`table.batchWrite`.

---

- [ ] **Step 1: Update `EntityWriteBatchBuilder` — use `EntitySchema`**

Replace `entity.putBatch(item, ...)` with `schema.toPutRequest(schema.marshal(item))`.
Replace `entity.deleteBatch(item)` with `schema.toDeleteRequest(item)`.

```typescript
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { BatchWriteItem, IDeleteBatchItem, IPutBatchItem } from "~/utils/batch/types.js";
import type { IEntityWriteBatchBuilder } from "./types.js";

export class EntityWriteBatchBuilder implements IEntityWriteBatchBuilder {
    private readonly schema: EntitySchema;

    public constructor(schema: EntitySchema) {
        this.schema = schema;
    }

    public put<T extends Record<string, any>>(item: IPutBatchItem<T>): BatchWriteItem {
        return this.schema.toPutRequest(item) as unknown as BatchWriteItem;
    }

    public delete(item: IDeleteBatchItem): BatchWriteItem {
        return this.schema.toDeleteRequest(item) as unknown as BatchWriteItem;
    }
}

export const createEntityWriteBatchBuilder = (schema: EntitySchema): IEntityWriteBatchBuilder => {
    return new EntityWriteBatchBuilder(schema);
};
```

- [ ] **Step 2: Update `EntityReadBatchBuilder` — use `EntitySchema`**

Replace `entity.getBatch(item)` with returning `{ Key: schema.toGetKeys(item) }`.

- [ ] **Step 3: Update `batchRead.ts` — use `DynamoDocClient.batchGet`**

Replace `table.batchGet(items)` and the `result.next()` loop with `client.batchGet(keys)`.

```typescript
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface BatchReadParams {
    client: DynamoDocClient;
    keys: GenericRecord[];
}

export const batchReadAll = async <T = GenericRecord>(
    params: BatchReadParams,
    maxChunk = 100
): Promise<T[]> => {
    if (params.keys.length === 0) {
        return [];
    }
    return params.client.batchGet<T>(params.keys, maxChunk);
};
```

- [ ] **Step 4: Update `batchWrite.ts` — use `DynamoDocClient.batchWrite`**

Replace `table.batchWrite(items, ...)` and the `hasUnprocessedItems`/`retry` loop with `client.batchWrite(items)`.

```typescript
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { BatchWriteItem, BatchWriteResult } from "./types.js";

export interface BatchWriteParams {
    client: DynamoDocClient;
    items: BatchWriteItem[];
}

export const batchWriteAll = async (
    params: BatchWriteParams,
    maxChunk = 25
): Promise<void> => {
    if (params.items.length === 0) {
        return;
    }
    /* Convert BatchWriteItem[] to the shape DynamoDocClient expects. */
    const writeRequests = params.items.map(item => {
        const key = Object.keys(item)[0];
        return item[key];
    });
    await params.client.batchWrite(writeRequests, maxChunk);
};
```

- [ ] **Step 5: Update `EntityReadBatch`, `EntityWriteBatch`, `TableReadBatch`, `TableWriteBatch`**

Each of these holds a reference to the dynamodb-toolbox `Entity` or `Table`. Replace with `EntitySchema` + `DynamoDocClient`. The public `IEntityReadBatch`/`IEntityWriteBatch`/`ITableReadBatch`/`ITableWriteBatch` interfaces stay the same.

- [ ] **Step 6: Update `batch/types.ts` — simplify**

The `BatchWriteResponse` type currently mirrors dynamodb-toolbox's response with `.next()`. Since `DynamoDocClient.batchWrite` handles retries internally, the `BatchWriteResult` can be simplified to `void` or kept as-is for backwards compat.

- [ ] **Step 7: Build**

Run: `yarn build -p @webiny/db-dynamodb 2>&1 | tail -30`
Fix type errors.

- [ ] **Step 8: Commit**

```bash
git add packages/db-dynamodb/src/utils/
git commit -m "refactor(db-dynamodb): rewire batch classes to DynamoDocClient"
```
