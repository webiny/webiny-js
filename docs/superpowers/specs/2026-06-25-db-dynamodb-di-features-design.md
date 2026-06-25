# db-dynamodb DI Features Design

## Goal

Restructure `packages/db-dynamodb` internals into proper DI features using Webiny's `createAbstraction` + feature pattern. Replace manual wiring (consumers calling `createTable()` / `createStandardEntity()` with raw `documentClient`) with DI-resolved factory abstractions that are decoratable, swappable, and centrally configured.

## Architecture

Four DI abstractions, layered bottom-up:

```
DynamoDBDocument (ONE raw AWS SDK connection)
  |
  v
DynamoDbTableFactory (DI singleton, holds the single DynamoDBDocument via DynamoDBClient)
  |  .create({ name, indexes? }) -> binds table name to shared connection
  v
DynamoDbDocumentClient (table-name-bound wrapper, NOT a new connection)
  |  get / put / delete / query / scan / batchGet / batchWrite
  |
  |-> DynamoDbEntityFactory (DI singleton, depends on DynamoDbBatchFactory)
  |     .create({ name, attributes, client }) -> IEntity
  |     .createStandard({ name, client, attributes? }) -> IEntity
  |     .createGlobal({ name, client, attributes? }) -> IEntity
  |
  |-> DynamoDbBatchFactory (DI singleton)
        .createEntityWriter({ schema, client }) -> IEntityWriteBatch
        .createEntityReader({ schema, client }) -> IEntityReadBatch
        .createTableWriter({ client }) -> ITableWriteBatch
        .createTableReader({ client }) -> ITableReadBatch
```

Key constraints:
- One `DynamoDBDocument` connection, shared across all tables.
- `DynamoDbDocumentClient` is an interface returned by the table factory, not a DI singleton.
- `DynamoDbTableFactory` resolves `DynamoDBClient` from DI internally; consumers never thread `documentClient` manually.
- `Entity` delegates batch creation to `DynamoDbBatchFactory`, so decorating the factory affects all batch operations system-wide.

## Folder Structure

```
packages/db-dynamodb/src/features/
  DynamoDbDocumentClient/
    abstractions.ts
    DynamoDbDocumentClient.ts

  DynamoDbTableFactory/
    abstractions.ts
    DynamoDbTableFactory.ts
    feature.ts

  DynamoDbEntityFactory/
    abstractions.ts
    attributes.ts
    DynamoDbEntityFactory.ts
    feature.ts

  DynamoDbBatchFactory/
    abstractions.ts
    DynamoDbBatchFactory.ts
    feature.ts

  DynamoDBClient/           (existing, kept for now)
    abstractions.ts
    DynamoDBClient.ts
    index.ts

  FilterUtil/               (moved from feature/)
  ValueFilter/              (moved from feature/)
```

## Abstraction: DynamoDbDocumentClient

Table-name-bound facade over the shared `DynamoDBDocument`. Renamed from the current `DynamoDocClient`.

```typescript
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

No `createAbstraction` call and no DI registration. This is a plain interface + namespace — instances are created by `DynamoDbTableFactory`, not resolved from the container. The namespace exists solely as a type carrier so consumers can reference `DynamoDbDocumentClient.Interface`.

The supporting types (`IQueryParams`, `IQueryPageResponse`, `IScanParams`, `IScanResponse`) currently defined in `utils/DynamoDocClient.ts` move into `features/DynamoDbDocumentClient/abstractions.ts` alongside the interface. They are re-exported from `exports/api/db.ts` so consumer imports like `import type { IScanParams } from "@webiny/db-dynamodb/utils/DynamoDocClient.js"` can migrate to `import type { IScanParams } from "@webiny/db-dynamodb/exports/api/db.js"`.

## Abstraction: DynamoDbTableFactory

Creates `DynamoDbDocumentClient` instances. Resolves the shared `DynamoDBDocument` from `DynamoDBClient` DI abstraction.

```typescript
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

Implementation depends on `DynamoDBClient` (resolved from DI). Uses `createFeature` for internal package registration (not `createImplementation`, which is for consumer-side wiring):

```typescript
class DynamoDbTableFactoryImpl implements DynamoDbTableFactory.Interface {
    public constructor(
        private readonly dynamoDBClient: DynamoDBClient.Interface
    ) {}

    public create(params: IDynamoDbTableFactoryCreateParams): DynamoDbDocumentClient.Interface {
        return new DynamoDbDocumentClient({
            documentClient: this.dynamoDBClient.client,
            tableName: params.name
        });
    }
}

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

Default GSI indexes: the current `createTable()` hardcodes GSI_TENANT, GSI1, and GSI2 as defaults. `DynamoDbDocumentClient` already handles index key resolution internally (its `getKeyAttributes()` method maps index names like `"GSI1"` to `GSI1_PK`/`GSI1_SK`). The `indexes` param on `create()` exists for consumers that need additional indexes beyond the standard set (e.g., `api-audit-logs-ddb` with dynamic GSI counts). No default index injection is needed in the factory — the document client resolves them at query time.

## Abstraction: DynamoDbEntityFactory

Creates `IEntity` instances. Depends on `DynamoDbBatchFactory` (passed through to `Entity`).

```typescript
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

Standard and global attribute sets (`standardEntityAttributes`, `globalEntityAttributes`) move from `utils/createEntity.ts` to `features/DynamoDbEntityFactory/attributes.ts`.

Feature registration (uses `createFeature` for internal package registration):

```typescript
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

Consumer packages can register named tokens for well-known entities:

```typescript
export const CmsEntryEntity = createAbstraction<IEntity<IStandardEntityAttributes<CmsEntry>>>(
    "Cms/EntryEntity"
);
```

## Abstraction: DynamoDbBatchFactory

Creates batch reader/writer instances. Pure factory, no DI dependencies.

```typescript
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

Feature registration (uses `createFeature` for internal package registration):

```typescript
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

## Entity Class Update

`Entity` receives `DynamoDbBatchFactory` and delegates batch creation to it:

```typescript
class Entity<T extends GenericRecord = GenericRecord> implements IEntity<T> {
    public constructor(
        params: EntityConstructor,
        private readonly batchFactory: DynamoDbBatchFactory.Interface
    ) { ... }

    public createEntityWriter(params?): IEntityWriteBatch<T> {
        return this.batchFactory.createEntityWriter({
            schema: this.schema,
            client: this.client,
            put: params?.put,
            delete: params?.delete
        });
    }

    public createEntityReader(params?): IEntityReadBatch<T> {
        return this.batchFactory.createEntityReader({
            schema: this.schema,
            client: this.client,
            read: params?.read
        });
    }

    public createTableWriter(): ITableWriteBatch {
        return this.batchFactory.createTableWriter({ client: this.client });
    }

    public createTableReader(): ITableReadBatch {
        return this.batchFactory.createTableReader({ client: this.client });
    }
}
```

## Feature Registration

All features register in `registerDynamoDBCore()`. Registration order matters — each feature's `register()` may call `container.resolve()` on earlier-registered abstractions:

```typescript
export const registerDynamoDBCore = ({ documentClient }: IRegisterDbDynamoDbExtension) => {
    return createRegisterExtensionPlugin(async context => {
        /* 1. Raw AWS client — no dependencies. */
        DynamoDBClientFeature.register(context.container, documentClient);
        /* 2. Batch factory — no dependencies. */
        DynamoDbBatchFactoryFeature.register(context.container);
        /* 3. Entity factory — resolves DynamoDbBatchFactory (registered in step 2). */
        DynamoDbEntityFactoryFeature.register(context.container);
        /* 4. Table factory — resolves DynamoDBClient (registered in step 1). */
        DynamoDbTableFactoryFeature.register(context.container);
        /* 5-6. Filters — no dependencies on the above. */
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
```

New abstractions exported from `exports/api/db.ts`:

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

## Migration

### Deleted

| File | Replacement |
|---|---|
| `utils/DynamoDocClient.ts` | `features/DynamoDbDocumentClient/DynamoDbDocumentClient.ts` |
| `utils/createTable.ts` | `DynamoDbTableFactory` |
| `utils/createEntity.ts` | `DynamoDbEntityFactory` + `features/DynamoDbEntityFactory/attributes.ts` |
| `utils/entity/getEntity.ts` | Consumers use `IEntity` directly |
| `utils/table/Table.ts` | `DynamoDbDocumentClient` + `DynamoDbBatchFactory` |
| `utils/table/types.ts` | `ITable` interface removed. `ITableWriteBatch`, `ITableReadBatch` kept. |
| `feature/` (singular) | Renamed to `features/` (plural) |

### Kept (updated)

| File | Change |
|---|---|
| `utils/entity/Entity.ts` | Constructor takes `DynamoDbBatchFactory`, delegates batch creation. Adds `createTableReader()` method. |
| `utils/entity/types.ts` | `IEntity.client` type changes from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`. All internal usages remain compatible since `DynamoDbDocumentClient` is the same class renamed. Adds `createTableReader(): ITableReadBatch` to `IEntity` interface. |
| `utils/entity/EntityWriteBatch.ts` | Update `client` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` in `IEntityWriteBatchParams` |
| `utils/entity/EntityReadBatch.ts` | Update `client` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` in `IEntityReadBatchParams` |
| `utils/table/TableWriteBatch.ts` | Update `table` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` |
| `utils/table/TableReadBatch.ts` | Update `table` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` |
| `utils/put.ts`, `get.ts`, `delete.ts`, `query.ts`, `scan.ts`, `cleanup.ts`, `count.ts` | Update `client` param types from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` |
| `utils/batch/batchWrite.ts` | Update `table` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` in `BatchWriteParams` |
| `utils/batch/batchRead.ts` | Update `client` param type from `DynamoDocClient` to `DynamoDbDocumentClient.Interface` in `BatchReadParams` |
| `toolbox.ts` | `TableDef` re-exported as alias for `DynamoDbDocumentClient.Interface`. `EntityConstructor.table` type changes from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`. Remove other stale re-exports, keep type exports (`AttributeDefinitions`, `EntityQueryOptions`, etc.) |
| `store/entity.ts` | Update: uses `ITable` and `createGlobalEntity` — switch to `DynamoDbDocumentClient.Interface` and `DynamoDbEntityFactory`-style construction |

### Moved (folder rename)

| From | To |
|---|---|
| `feature/DynamoDBClient/` | `features/DynamoDBClient/` |
| `feature/FilterUtil/` | `features/FilterUtil/` |
| `feature/ValueFilter/` | `features/ValueFilter/` |

### ITable Removal

`ITable` interface is replaced by `DynamoDbDocumentClient.Interface` + `DynamoDbBatchFactory.Interface`. Consumers that typed against `ITable` switch to `DynamoDbDocumentClient.Interface`.

The current `ITable` exposes a `.table` property (the inner `DynamoDocClient`). With the new design, `DynamoDbDocumentClient.Interface` IS the client directly — there is no `.table` indirection. Consumer code that calls `getTable().table` to pass to entity constructors must be updated to use `getTable()` directly.

Affected consumer interfaces that expose `ITable` in return types:
- `api-headless-cms-ddb/src/types.ts` — `getTable: () => ITable`
- `api-headless-cms-ddb-es/src/types.ts` — `getTable: () => ITable`, `getEsTable: () => ITable`
- `api-core-ddb/src/adminUsers/types.ts` — `getTable(): ITable`
- `api-opensearch/src/db/entity.ts` — `ITable` used as parameter type
- `api-opensearch/src/db/table.ts` — return type `ITable`

All of these change their return/param type to `DynamoDbDocumentClient.Interface`.

### IEntity Interface Addition

Adding `createTableReader(): ITableReadBatch` to the `IEntity` interface is a breaking change for any test mocks or stub implementations of `IEntity` in consumer packages. These must be updated to include the new method.

### Consumer Migration Order

1. `webiny` (re-export surface at `src/api/db.ts` — update import paths from `feature/` to `features/`)
2. `api-core-ddb` (tenancy, security, adminUsers, keyValueStore)
3. `api-headless-cms-ddb` (entry, group, model definitions + table)
4. `api-headless-cms-ddb-es` (entry, group, model definitions + feature)
5. `api-opensearch` (table + entity creation)
6. `api-elasticsearch-tasks` (Manager, ElasticsearchSynchronize, ReindexingTaskRunner)
7. `api-aco-ddb` (FolderLevelPermissionsStorageOperations)
8. `api-audit-logs-ddb` (entity — note: uses dynamic GSI count via `indexes` param)
9. `api-websockets-ddb` (entity)
10. `api-file-manager` (test utils — `TableDef` type alias + `IScanParams` import)

Special cases:
- `webiny/src/api/db.ts` re-exports from `@webiny/db-dynamodb/feature/` paths — must be updated to `features/` after the folder rename.
- `api-audit-logs-ddb` uses a variable GSI count (`gsiAmount` injected at runtime). This maps to `DynamoDbTableFactory.create({ name, indexes: createTableGSIIndexes(gsiAmount) })`.
- `api-audit-logs-ddb` uses `ReturnType<typeof createTable>` as a type — must be manually replaced with `DynamoDbDocumentClient.Interface`.
- `api-file-manager` test utils import `IScanParams` from `@webiny/db-dynamodb/utils/DynamoDocClient.js` — this path is deleted. `IScanParams` must be re-exported from the new `DynamoDbDocumentClient` abstractions file or from `exports/api/db.ts`.
- `api-file-manager` test utils use `TableDef` type alias — these will continue to work via the re-export in `toolbox.ts`.

### Direct Entity Class Construction

The `Entity` class constructor signature changes to require `DynamoDbBatchFactory.Interface` as a second parameter. Any consumer that imports and constructs `Entity` directly (rather than through `DynamoDbEntityFactory`) will break at compile time. Known consumer: `api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts` imports `Entity` class directly. These must either switch to `DynamoDbEntityFactory` or receive the batch factory as a dependency.

### Test Files

Test setup files and test utilities that use `createTable` or import from deleted paths also need migration. Known files:
- `api-headless-cms-ddb/__tests__/__api__/setupFile.js` — uses `registerDynamoDBCore` (no change needed)
- `api-headless-cms-ddb-es/__tests__/__api__/setupFile.js` — uses `registerDynamoDBCore` (no change needed)
- `api-headless-cms-ddb-es/__tests__/graphql/handler.ts` — uses `createTable` (must migrate to `DynamoDbTableFactory`)
- `api-file-manager/__tests__/utils/scanTable.ts` — imports `TableDef` and `IScanParams` from deleted paths

Project template files under `project-aws/_templates/` that import `registerDynamoDBCore` and `DynamoDbDriver` do not need migration since those symbols are not being removed.

### No Backwards Compatibility

Old `createTable()` / `createStandardEntity()` / `createGlobalEntity()` are deleted, not deprecated. All consumers move to factory abstractions.

## Consumer Example

Before:

```typescript
import { createTable, createStandardEntity } from "@webiny/db-dynamodb";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

class TenancyStorageImpl {
    public constructor(dynamoDBClient: DynamoDBClient.Interface) {
        const table = createTable({
            name: String(process.env.DB_TABLE),
            documentClient: dynamoDBClient.client
        });
        this.entity = createStandardEntity<Tenant>({
            name: "Tenancy",
            table: table.table
        });
    }
}

export const TenancyStorageFeature = TenancyStorage.createImplementation({
    implementation: TenancyStorageImpl,
    dependencies: [DynamoDBClient]
});
```

After:

```typescript
import {
    DynamoDbTableFactory,
    DynamoDbEntityFactory
} from "@webiny/db-dynamodb/exports/api/db.js";

class TenancyStorageImpl {
    private readonly entity: IEntity<IStandardEntityAttributes<Tenant>>;

    public constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        const table = tableFactory.create({ name: String(process.env.DB_TABLE) });
        this.entity = entityFactory.createStandard<Tenant>({
            name: "Tenancy",
            client: table
        });
    }
}

export const TenancyStorageFeature = TenancyStorage.createImplementation({
    implementation: TenancyStorageImpl,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
```

Note: `TenancyStorage` is the consumer's own abstraction token (e.g., `const TenancyStorage = createAbstraction<ITenancyStorage>("...")`). Internal `db-dynamodb` features use `createFeature`; consumer packages use `Abstraction.createImplementation`.
