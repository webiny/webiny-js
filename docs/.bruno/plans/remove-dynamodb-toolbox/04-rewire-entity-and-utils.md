# Task 4: Rewire `Entity` class and low-level utils

**Files:**
- Modify: `packages/db-dynamodb/src/utils/entity/Entity.ts`
- Modify: `packages/db-dynamodb/src/utils/entity/types.ts`
- Modify: `packages/db-dynamodb/src/utils/entity/getEntity.ts`
- Modify: `packages/db-dynamodb/src/utils/put.ts`
- Modify: `packages/db-dynamodb/src/utils/get.ts`
- Modify: `packages/db-dynamodb/src/utils/delete.ts`
- Modify: `packages/db-dynamodb/src/utils/query.ts`
- Modify: `packages/db-dynamodb/src/utils/cleanup.ts`
- Modify: `packages/db-dynamodb/src/utils/scan.ts`
- Modify: `packages/db-dynamodb/src/utils/createEntity.ts`

**Interfaces:**
- Consumes: `DynamoDocClient` from Task 1, `EntitySchema` from Task 2, updated `Table`/`TableDef` from Task 3
- Produces: Updated `Entity` class that holds `EntitySchema` + `DynamoDocClient` instead of dynamodb-toolbox `Entity`. The `IEntity` interface shape stays stable. The `entity` property type changes from `BaseEntity` to `EntitySchema`.

This is the largest task. The `Entity` class currently wraps `new BaseEntity(params)` and delegates all operations to it. We replace the inner `BaseEntity` with `EntitySchema` (for marshalling) + `DynamoDocClient` (for execution).

The standalone functions (`put`, `get`, `delete`, `queryOne`, `queryAll`, etc.) currently take `entity: Entity` (the dynamodb-toolbox Entity). They need to take `DynamoDocClient` + `EntitySchema` instead — or we can simplify by making them methods of the `Entity` class directly and removing the standalone functions. However, `put` is called directly by 9 external packages. The safest approach: update the standalone functions to accept `{ client: DynamoDocClient, schema: EntitySchema }` and update the `Entity` class to pass these.

---

- [ ] **Step 1: Update `put.ts` — use `DynamoDocClient` directly**

```typescript
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type IPutParamsItem<T extends GenericRecord = GenericRecord> = {
    PK: string;
    SK: string;
    [key: string]: any;
} & T;

export interface IPutParams<T extends GenericRecord = GenericRecord> {
    client: DynamoDocClient;
    schema: EntitySchema;
    item: IPutParamsItem<T>;
}

export const put = async <T extends GenericRecord = GenericRecord>(params: IPutParams<T>) => {
    const { client, schema, item } = params;
    const marshalled = schema.marshal(item);
    await client.put(marshalled);
};
```

- [ ] **Step 2: Update `get.ts` — use `DynamoDocClient` directly**

```typescript
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";

export interface GetRecordParamsKeys {
    PK: string;
    SK: string;
}

export interface GetRecordParams {
    client: DynamoDocClient;
    schema: EntitySchema;
    keys: GetRecordParamsKeys;
}

export const get = async <T>(params: GetRecordParams): Promise<T | null> => {
    const { client, keys } = params;
    return client.get<T>(keys);
};

export const getClean = async <T>(params: GetRecordParams): Promise<T | null> => {
    const { client, schema, keys } = params;
    const result = await client.get(keys);
    if (!result) {
        return null;
    }
    return schema.unmarshal<T>(result);
};
```

- [ ] **Step 3: Update `delete.ts` — use `DynamoDocClient` directly**

```typescript
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";

export interface IDeleteItemKeys {
    PK: string;
    SK: string;
}

export interface IDeleteItemParams {
    client: DynamoDocClient;
    keys: IDeleteItemKeys;
}

export const deleteItem = async (params: IDeleteItemParams) => {
    const { client, keys } = params;
    await client.delete(keys);
};
```

- [ ] **Step 4: Update `query.ts` — use `DynamoDocClient` directly**

Replace `entity.query(partitionKey, options)` and the `result.next()` pagination loop with `client.query(params)` (which handles pagination internally) and `client.queryPage(params)` for single-page queries.

The `queryOne` function uses `client.queryOne`. The `queryAll` function uses `client.query` (auto-paginates). The `queryPerPage` function uses `client.queryPage`.

The `cleanupItem`/`cleanupItems` calls in `queryOneClean`/`queryAllClean`/`queryPerPageClean` are replaced with `schema.unmarshal()`.

```typescript
import type { DynamoDocClient, IQueryParams as IClientQueryParams } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { EntityQueryOptions } from "~/toolbox.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface QueryAllParams {
    client: DynamoDocClient;
    schema: EntitySchema;
    partitionKey: string;
    options?: EntityQueryOptions;
}

export interface QueryOneParams extends QueryAllParams {
    options?: Omit<EntityQueryOptions, "limit">;
}

export const queryOne = async <T>(params: QueryOneParams): Promise<T | null> => {
    const { client, partitionKey, options } = params;
    return client.queryOne<T>(toClientParams(partitionKey, options));
};

export const queryOneClean = async <T>(params: QueryOneParams): Promise<T | null> => {
    const result = await queryOne(params);
    if (!result) {
        return null;
    }
    return params.schema.unmarshal<T>(result as GenericRecord);
};

export const queryAll = async <T>(params: QueryAllParams): Promise<T[]> => {
    const { client, partitionKey, options } = params;
    return client.query<T>(toClientParams(partitionKey, options));
};

export const queryAllClean = async <T>(params: QueryAllParams): Promise<T[]> => {
    const results = await queryAll<T>(params);
    return results.map(item => params.schema.unmarshal<T>(item as GenericRecord));
};

export interface IQueryPageResponse<T> {
    items: T[];
    lastEvaluatedKey: GenericRecord;
}

export const queryPerPage = async <T>(params: QueryAllParams): Promise<IQueryPageResponse<T>> => {
    const { client, partitionKey, options } = params;
    const result = await client.queryPage<T>(toClientParams(partitionKey, {
        ...options,
        limit: options?.limit || 50
    }));
    return {
        items: result.items,
        lastEvaluatedKey: result.lastEvaluatedKey as GenericRecord
    };
};

export const queryPerPageClean = async <T>(params: QueryAllParams): Promise<IQueryPageResponse<T>> => {
    const result = await queryPerPage<T>(params);
    return {
        items: result.items.map(item => params.schema.unmarshal<T>(item as GenericRecord)),
        lastEvaluatedKey: result.lastEvaluatedKey
    };
};

export const queryAllWithCallback = async <T>(
    params: QueryAllParams,
    callback: (items: T[]) => Promise<void>
): Promise<void> => {
    const { client, partitionKey, options } = params;
    let startKey: GenericRecord | undefined;

    do {
        const result = await client.queryPage<T>(toClientParams(partitionKey, {
            ...options,
            startKey: startKey || options?.startKey
        }));
        if (result.items.length > 0) {
            await callback(result.items);
        }
        startKey = result.lastEvaluatedKey;
    } while (startKey);
};

const toClientParams = (partitionKey: string, options?: EntityQueryOptions): IClientQueryParams => {
    return {
        partitionKey,
        index: options?.index,
        limit: options?.limit,
        reverse: options?.reverse,
        consistent: options?.consistent,
        beginsWith: options?.beginsWith,
        eq: options?.eq,
        lt: options?.lt,
        lte: options?.lte,
        gt: options?.gt,
        gte: options?.gte,
        between: options?.between as [string, string] | [number, number] | undefined,
        startKey: options?.startKey as GenericRecord | undefined,
        attributes: options?.attributes
    };
};
```

- [ ] **Step 5: Update `cleanup.ts` — delegate to `EntitySchema.unmarshal`**

```typescript
import type { EntitySchema } from "~/utils/EntitySchema.js";

export function cleanupItem<T>(
    schema: EntitySchema,
    item?: T | null
): T | null {
    if (!item) {
        return null;
    }
    return schema.unmarshal<T>(item as any);
}

export function cleanupItems<T>(
    schema: EntitySchema,
    items: T[]
): T[] {
    return items.map(item => cleanupItem<T>(schema, item) as T);
}
```

- [ ] **Step 6: Update `scan.ts` — use `DynamoDocClient.scan` directly**

Replace `table.scan()` with `client.scan()`. The `ScanResponse` shape is already matching (both have `items`, `next`, `lastEvaluatedKey`).

- [ ] **Step 7: Update `Entity` class — hold `EntitySchema` + `DynamoDocClient`**

```typescript
import type { AttributeDefinitions, EntityQueryOptions } from "~/toolbox.js";
import { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { ITableWriteBatch } from "../table/types.js";
import type {
    IEntity,
    IEntityCreateEntityReaderParams,
    IEntityCreateEntityWriterParams,
    IEntityQueryAllParams,
    IEntityQueryOneParams,
    IEntityQueryPerPageParams,
    IEntityReadBatch,
    IEntityWriteBatch
} from "./types.js";
import type { IPutParamsItem } from "../put.js";
import { put } from "../put.js";
import type { GetRecordParamsKeys } from "../get.js";
import { get, getClean } from "../get.js";
import type { IDeleteItemKeys } from "../delete.js";
import { deleteItem } from "../delete.js";
import { createEntityReadBatch } from "./EntityReadBatch.js";
import { createEntityWriteBatch } from "./EntityWriteBatch.js";
import { createTableWriteBatch } from "~/utils/table/TableWriteBatch.js";
import { queryAll, queryAllClean, queryOne, queryOneClean, queryPerPage } from "../query.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface EntityConstructor {
    name: string;
    attributes: AttributeDefinitions;
    table?: DynamoDocClient;
    timestamps?: boolean;
}

export class Entity<T extends GenericRecord = GenericRecord> implements IEntity<T> {
    public readonly schema: EntitySchema;
    public readonly client: DynamoDocClient;

    public get name(): string {
        return this.schema.name;
    }

    public constructor(params: EntityConstructor) {
        this.schema = new EntitySchema({
            name: params.name,
            attributes: params.attributes,
            timestamps: params.timestamps
        });
        if (!params.table) {
            throw new Error(`No table provided for entity "${params.name}".`);
        }
        this.client = params.table;
    }

    public createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T> {
        return createEntityReadBatch({
            schema: this.schema,
            client: this.client,
            read: params?.read
        });
    }

    public createEntityWriter(params?: IEntityCreateEntityWriterParams): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            schema: this.schema,
            client: this.client,
            put: params?.put,
            delete: params?.delete
        });
    }

    public createTableWriter(): ITableWriteBatch {
        return createTableWriteBatch({ table: this.client });
    }

    public async put<T extends GenericRecord = GenericRecord>(item: IPutParamsItem<T>): Promise<void> {
        return put({ client: this.client, schema: this.schema, item });
    }

    public async get<T>(keys: GetRecordParamsKeys): Promise<T | null> {
        return get<T>({ client: this.client, schema: this.schema, keys });
    }

    public async getClean<T>(keys: GetRecordParamsKeys): Promise<T | null> {
        return getClean<T>({ client: this.client, schema: this.schema, keys });
    }

    public async delete(keys: IDeleteItemKeys): Promise<void> {
        return deleteItem({ client: this.client, keys });
    }

    public async queryOne<T>(params: IEntityQueryOneParams): Promise<T | null> {
        return queryOne<T>({ ...params, client: this.client, schema: this.schema });
    }

    public async queryOneClean<T>(params: IEntityQueryOneParams): Promise<T | null> {
        return queryOneClean<T>({ ...params, client: this.client, schema: this.schema });
    }

    public async queryAll<T>(params: IEntityQueryAllParams): Promise<T[]> {
        return queryAll<T>({ ...params, client: this.client, schema: this.schema });
    }

    public async queryAllClean<T>(params: IEntityQueryAllParams): Promise<T[]> {
        return queryAllClean<T>({ ...params, client: this.client, schema: this.schema });
    }

    public async queryPerPage<T>(params: IEntityQueryPerPageParams) {
        return queryPerPage<T>({ ...params, client: this.client, schema: this.schema });
    }
}

export const createEntity = <T extends GenericRecord = GenericRecord>(
    params: EntityConstructor
): IEntity<T> => {
    return new Entity<T>(params);
};
```

- [ ] **Step 8: Update `entity/types.ts` — remove dynamodb-toolbox `Entity` import**

Change `IEntity.entity: BaseEntity` to `IEntity.schema: EntitySchema` and add `IEntity.client: DynamoDocClient`. Update all the query/put/get/delete param types to use the new shapes.

- [ ] **Step 9: Update `getEntity.ts` — simplify**

Since there's no more dynamodb-toolbox Entity to unwrap, this becomes trivial (or can be removed entirely if only used internally). The `EntityOption` type becomes just `Entity`.

- [ ] **Step 10: Update `createEntity.ts` (the `createStandardEntity`/`createGlobalEntity` file)**

These already define attributes and call `createEntity`. The only change is the `table` property type — it now expects `DynamoDocClient` instead of dynamodb-toolbox `Table`. Since consumers pass `table.table` and `table.table` is now `DynamoDocClient`, this works.

- [ ] **Step 11: Build `@webiny/db-dynamodb`**

Run: `yarn build -p @webiny/db-dynamodb 2>&1 | tail -30`
Fix any type errors.

- [ ] **Step 12: Commit**

```bash
git add packages/db-dynamodb/src/
git commit -m "refactor(db-dynamodb): rewire Entity and utils to use DynamoDocClient + EntitySchema"
```
