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

export const DynamoDbDocumentClient = createAbstraction<IDynamoDbDocumentClient>(
    "Db/DynamoDB/DynamoDbDocumentClient"
);

export namespace DynamoDbDocumentClient {
    export type Interface = IDynamoDbDocumentClient;
}
```

No DI registration. Instances are created by `DynamoDbTableFactory`.

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

Implementation depends on `DynamoDBClient` (resolved from DI):

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

export const DynamoDbTableFactoryFeature = DynamoDbTableFactory.createImplementation({
    implementation: DynamoDbTableFactoryImpl,
    dependencies: [DynamoDBClient]
});
```

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

Feature registration:

```typescript
export const DynamoDbEntityFactoryFeature = DynamoDbEntityFactory.createImplementation({
    implementation: DynamoDbEntityFactoryImpl,
    dependencies: [DynamoDbBatchFactory]
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

Feature registration:

```typescript
export const DynamoDbBatchFactoryFeature = DynamoDbBatchFactory.createImplementation({
    implementation: DynamoDbBatchFactoryImpl,
    dependencies: []
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
}
```

## Feature Registration

All features register in `registerDynamoDBCore()`:

```typescript
export const registerDynamoDBCore = ({ documentClient }: IRegisterDbDynamoDbExtension) => {
    return createRegisterExtensionPlugin(async context => {
        DynamoDBClientFeature.register(context.container, documentClient);
        DynamoDbBatchFactoryFeature.register(context.container);
        DynamoDbEntityFactoryFeature.register(context.container);
        DynamoDbTableFactoryFeature.register(context.container);
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
```

New abstractions exported from `exports/api/db.ts`:

```typescript
export { DynamoDBClient } from "~/features/DynamoDBClient/index.js";
export { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
export { DynamoDbTableFactory } from "~/features/DynamoDbTableFactory/abstractions.js";
export { DynamoDbEntityFactory } from "~/features/DynamoDbEntityFactory/abstractions.js";
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
| `feature/` (singular) | Renamed to `features/` (plural) |

### Kept (updated)

| File | Change |
|---|---|
| `utils/entity/Entity.ts` | Constructor takes `DynamoDbBatchFactory`, delegates batch creation |
| `utils/entity/EntityWriteBatch.ts` | No change, used by `DynamoDbBatchFactory` |
| `utils/entity/EntityReadBatch.ts` | No change, used by `DynamoDbBatchFactory` |
| `utils/table/TableWriteBatch.ts` | No change, used by `DynamoDbBatchFactory` |
| `utils/table/TableReadBatch.ts` | No change, used by `DynamoDbBatchFactory` |
| `utils/put.ts`, `get.ts`, `delete.ts`, `query.ts`, `scan.ts`, `cleanup.ts` | No change, used by `Entity` and `DynamoDbDocumentClient` internally |
| `toolbox.ts` | Remove stale re-exports, keep type exports |

### ITable Removal

`ITable` interface is replaced by `DynamoDbDocumentClient.Interface` + `DynamoDbBatchFactory.Interface`. Consumers that typed against `ITable` switch to `DynamoDbDocumentClient.Interface`.

### Consumer Migration Order

1. `api-core-ddb` (tenancy, security, adminUsers, keyValueStore)
2. `api-headless-cms-ddb`
3. `api-headless-cms-ddb-es` / `api-opensearch`
4. `api-elasticsearch-tasks`
5. Remaining `-ddb` packages (audit-logs, file-manager, form-builder, page-builder, etc.)

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

export const TenancyStorage = Abstraction.createImplementation({
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

export const TenancyStorage = Abstraction.createImplementation({
    implementation: TenancyStorageImpl,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
```
