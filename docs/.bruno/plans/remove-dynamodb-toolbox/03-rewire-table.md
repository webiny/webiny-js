# Task 3: Rewire `Table` class to use `DynamoDocClient`

**Files:**
- Modify: `packages/db-dynamodb/src/utils/table/Table.ts`
- Modify: `packages/db-dynamodb/src/utils/table/types.ts`
- Modify: `packages/db-dynamodb/src/utils/createTable.ts`
- Modify: `packages/db-dynamodb/src/toolbox.ts` (update re-exports, keep type aliases temporarily)

**Interfaces:**
- Consumes: `DynamoDocClient` from Task 1
- Produces: Updated `Table` class that internally wraps `DynamoDocClient` instead of dynamodb-toolbox's `Table`. The `ITable` interface shape remains the same but the `.table` property type changes from dynamodb-toolbox `Table` to `DynamoDocClient`.

This is the pivotal change. The `Table` class today wraps `new BaseTable(params)` from dynamodb-toolbox. We replace it so it creates a `DynamoDocClient` instead. The `ITable.table` property type needs to change — it currently exposes `Table<Name, PK, SK>` from dynamodb-toolbox. We change it to `DynamoDocClient`.

All external consumers importing `TableDef` from `toolbox.ts` just need the type — they pass it to `batchReadAll`/`batchWriteAll` and entity constructors. We update `TableDef` to be an alias for `DynamoDocClient`.

---

- [ ] **Step 1: Update `toolbox.ts` — move type definitions, keep backward compat types**

Replace the dynamodb-toolbox imports with local type definitions. Keep `TableDef`, `EntityQueryOptions`, `EntityConstructor`, `AttributeDefinitions` etc. as local types (most already were, except `Entity` and `Table`).

`toolbox.ts` becomes:

```typescript
/* Types that used to come from dynamodb-toolbox. Now defined locally. */

export type {
    DynamoDBTypes,
    AttributeDefinition,
    AttributeDefinitions
} from "~/utils/EntitySchema.js";

export type { DynamoDocClient as TableDef } from "~/utils/DynamoDocClient.js";

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
    table?: TableDef;
    timestamps?: boolean;
}

export interface EntityQueryOptions {
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
    startKey?: Record<string, unknown>;
    filters?: Record<string, unknown>;
    attributes?: string[];
}

export type ScanOptions = {
    index?: string;
    limit?: number;
    startKey?: Record<string, unknown>;
    segment?: number;
    totalSegments?: number;
    filters?: Record<string, unknown>;
    consistent?: boolean;
};

export type TableConstructor = {
    name: string;
    DocumentClient: any;
    partitionKey: string;
    sortKey?: string;
    indexes?: Record<string, { partitionKey: string; sortKey?: string }>;
    autoExecute?: boolean;
    autoParse?: boolean;
};
```

- [ ] **Step 2: Update `Table` class**

Replace `BaseTable` with `DynamoDocClient`:

```typescript
import type { TableConstructor } from "~/toolbox.js";
import { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { ITable, ITableReadBatch, ITableScanParams, ITableScanResponse, ITableWriteBatch } from "./types.js";
import { createTableWriteBatch } from "./TableWriteBatch.js";
import { createTableReadBatch } from "./TableReadBatch.js";

export class Table<
    Name extends string = string,
    PartitionKey extends string = string,
    SortKey extends string = string
> implements ITable<Name, PartitionKey, SortKey> {
    public readonly table: DynamoDocClient;

    public constructor(params: TableConstructor) {
        this.table = new DynamoDocClient({
            documentClient: params.DocumentClient,
            tableName: params.name
        });
    }

    public createWriter(): ITableWriteBatch {
        return createTableWriteBatch({ table: this.table });
    }

    public createReader(): ITableReadBatch {
        return createTableReadBatch({ table: this.table });
    }

    public async scan<T>(params: ITableScanParams): Promise<ITableScanResponse<T>> {
        return this.table.scan<T>(params);
    }
}
```

- [ ] **Step 3: Update `table/types.ts` — change `Table` references to `DynamoDocClient`**

Replace `import { Table } from "~/toolbox.js"` with `import type { DynamoDocClient } from "~/utils/DynamoDocClient.js"`. Change `ITable.table` type from `Table<Name, PK, SK>` to `DynamoDocClient`. Change `ITableReadBatchBuilderGetResponse.Table` to `DynamoDocClient`. Change `ITableWriteBatch` and `ITableReadBatch` entity params from dynamodb-toolbox `Entity` to `EntitySchema`.

- [ ] **Step 4: Update `createTable.ts`**

Same structure, but now `Table` constructor receives `TableConstructor` shape and wraps `DynamoDocClient` internally:

```typescript
import type { ITable } from "~/utils/table/index.js";
import { Table } from "~/utils/table/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ICreateTableParams {
    name: string;
    documentClient: DynamoDBDocument;
    indexes?: Record<string, { partitionKey: string; sortKey?: string }>;
}

export const createTable = (params: ICreateTableParams): ITable<string, "PK", "SK"> => {
    const { documentClient, indexes = {}, ...rest } = params;
    return new Table({
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI_TENANT: { partitionKey: "GSI_TENANT" },
            GSI1: { partitionKey: "GSI1_PK", sortKey: "GSI1_SK" },
            GSI2: { partitionKey: "GSI2_PK", sortKey: "GSI2_SK" },
            ...indexes
        },
        autoExecute: true,
        autoParse: true,
        ...rest
    });
};
```

- [ ] **Step 5: Build to verify type compatibility**

Run: `yarn build -p @webiny/db-dynamodb 2>&1 | tail -30`
Expected: May have errors from downstream files still importing old types — that's expected, we fix in next tasks.

- [ ] **Step 6: Commit**

```bash
git add packages/db-dynamodb/src/toolbox.ts packages/db-dynamodb/src/utils/table/ packages/db-dynamodb/src/utils/createTable.ts
git commit -m "refactor(db-dynamodb): rewire Table to use DynamoDocClient"
```
