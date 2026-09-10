# api-search-index-tasks Design Spec

## Goal

Extract platform-agnostic search index tasks from `@webiny/api-elasticsearch-tasks` into two new packages:

- `@webiny/api-search-index-tasks` — task definitions, runners, and abstractions
- `@webiny/api-search-index-tasks-ddb-os` — DynamoDB + OpenSearch bridge implementations

`@webiny/api-elasticsearch-tasks` retains only the `dataSynchronization` task and a thin re-export feature, heading toward eventual deletion.

## Packages

### @webiny/api-search-index-tasks

Platform-agnostic. Contains task definitions, runners, and three core abstractions. No AWS, DynamoDB, or OpenSearch dependencies.

**Dependencies:** `@webiny/api`, `@webiny/api-core`, `@webiny/feature`, `@webiny/error`

```
src/
  abstractions/
    StorageScanner.ts
    IndexManager.ts
    StorageWriter.ts
    IndexManagerFactory.ts
  tasks/
    reindex/
      abstractions/
        ReindexRunner.ts
      ReindexTask.ts
      ReindexRunner.ts
    createIndexes/
      abstractions/
        CreateIndexesRunner.ts
        OnBeforeTrigger.ts
      CreateIndexesTask.ts
      CreateIndexesRunner.ts
      OnBeforeTrigger.ts
    enableIndexing/
      abstractions/
        EnableIndexingRunner.ts
      EnableIndexingTask.ts
      EnableIndexingRunner.ts
  feature.ts
  index.ts
```

### @webiny/api-search-index-tasks-ddb-os

Bridge package. Provides DynamoDB and OpenSearch implementations for all three abstractions.

**Dependencies:** `@webiny/api-search-index-tasks`, `@webiny/api-opensearch`, `@webiny/db-dynamodb`, `@webiny/aws-sdk`, `@webiny/feature`, `@webiny/error`, `@webiny/utils`

```
src/
  StorageScanner.ts
  StorageWriter.ts
  IndexManager.ts
  IndexManagerFactory.ts
  settings/
    DisableIndexing.ts
    EnableIndexing.ts
    IndexSettingsManager.ts
  feature.ts
  index.ts
```

## Abstractions

### StorageScanner

Reads records from the primary database. Uses opaque string cursor for pagination — bridge serializes its native cursor format (DDB's `{PK, SK}`, PG's offset, etc.) into a string.

```typescript
export interface IStorageScannerRecord {
    index: string;
    entity: string;
    data: GenericRecord;
    modified: string;
}

export interface IStorageScannerResult {
    items: IStorageScannerRecord[];
    cursor?: string;
}

export interface IStorageScanner {
    scan(cursor: string | undefined, limit: number): Promise<IStorageScannerResult>;
}

export const StorageScanner = createAbstraction<IStorageScanner>("SearchIndexTasks/StorageScanner");

export namespace StorageScanner {
    export type Interface = IStorageScanner;
    export type Record = IStorageScannerRecord;
    export type Result = IStorageScannerResult;
}
```

### IndexManager

Manages search indices — create, check existence, enable/disable indexing, list.

```typescript
export interface IIndexSettings {
    numberOfReplicas: number;
    refreshInterval: string;
}

export interface IIndexSettingsMap {
    [index: string]: IIndexSettings;
}

export interface IIndexManager {
    list(): Promise<string[]>;
    indexExists(index: string): Promise<boolean>;
    createIndex(index: string, settings?: GenericRecord): Promise<void>;
    disableIndexing(index: string): Promise<IIndexSettings>;
    enableIndexing(index?: string): Promise<void>;
    settings: IIndexSettingsMap;
}

export const IndexManager = createAbstraction<IIndexManager>("SearchIndexTasks/IndexManager");

export namespace IndexManager {
    export type Interface = IIndexManager;
    export type Settings = IIndexSettings;
    export type SettingsMap = IIndexSettingsMap;
}
```

### StorageWriter

Writes modified records back to the primary database. Batch pattern: buffer with `put`, flush with `execute`.

```typescript
export interface IStorageWriterRecord {
    entity: string;
    data: GenericRecord;
}

export interface IStorageWriter {
    put(record: IStorageWriterRecord): void;
    execute(): Promise<void>;
}

export const StorageWriter = createAbstraction<IStorageWriter>("SearchIndexTasks/StorageWriter");

export namespace StorageWriter {
    export type Interface = IStorageWriter;
    export type Record = IStorageWriterRecord;
}
```

### IndexManagerFactory

Creates IndexManager instances with initial settings. Abstraction in core package, implementation in bridge.

```typescript
export interface IIndexManagerFactoryParams {
    settings: IIndexSettingsMap;
    defaults?: Partial<IIndexSettings>;
}

export interface IIndexManagerFactory {
    createIndexManager(params: IIndexManagerFactoryParams): IIndexManager;
}

export const IndexManagerFactory = createAbstraction<IIndexManagerFactory>("SearchIndexTasks/IndexManagerFactory");

export namespace IndexManagerFactory {
    export type Interface = IIndexManagerFactory;
    export type Params = IIndexManagerFactoryParams;
}
```

## Tasks

Each task declares only the dependencies it needs. Task IDs are preserved for backward compatibility with existing DB records.

### ReindexTask

Scans primary DB records, checks index existence, disables indexing for bulk operations, writes modified records, re-enables indexing on completion.

- **ID:** `"elasticsearchReindexing"`
- **Title:** `"Reindex Search Index"`
- **Max iterations:** 500
- **Task depends on:** `IndexManagerFactory`, `ReindexRunner`
- **Runner depends on:** `StorageScanner`, `StorageWriter`

Runner receives `IndexManager` instance as a method parameter from the task (task creates it via `IndexManagerFactory`). `StorageScanner` and `StorageWriter` are injected via DI constructor. Runner scans with opaque cursor, filters by optional `matching` input, checks index existence, disables indexing per index, writes records, continues until no more items or close to timeout.

### CreateIndexesTask

Creates missing search indexes. Runs `onBeforeTrigger` to ensure task indexes exist before task starts.

- **ID:** `"elasticsearchCreateIndexes"`
- **Title:** `"Create Missing Search Indexes"`
- **Max iterations:** 2
- **Task depends on:** `IndexManagerFactory`, `CreateIndexesRunner`, `OnBeforeTrigger`
- **Runner depends on:** `IndexManager` only (via factory in task)

### EnableIndexingTask

Re-enables indexing settings on search indexes after bulk operations.

- **ID:** `"elasticsearchEnableIndexing"`
- **Title:** `"Enable Search Indexing"`
- **Max iterations:** 2
- **Task depends on:** `IndexManagerFactory`, `EnableIndexingRunner`
- **Runner depends on:** `IndexManager` only (via factory in task)

## Bridge Implementations (ddb-os)

### DDB StorageScanner

- Wraps DynamoDB table scan
- Deserializes opaque cursor string to `{PK, SK}` for `ExclusiveStartKey`
- Serializes `LastEvaluatedKey` back to opaque cursor string (JSON.stringify/parse)
- Maps DDB records (`IDynamoDbElasticsearchRecord`) to `IStorageScannerRecord`

### DDB StorageWriter

- Wraps `createTableWriteBatch` from `@webiny/db-dynamodb`
- Resolves entity by name from DDB table
- Buffers `put` calls, flushes on `execute`

### OS IndexManager

- Same logic as current `IndexManager` class in `api-elasticsearch-tasks`
- Uses `IndexSettingsManager` for putSettings/getSettings on OpenSearch client
- `DisableIndexing` / `EnableIndexing` helpers handle safe defaults

### IndexManagerFactory

- Creates `IndexManager` with OS client + enable/disable helpers + initial settings
- Registered as implementation of `IndexManagerFactory` abstraction

## Feature Registration

### Core package feature

```typescript
export const SearchIndexTasksFeature = createFeature({
    name: "SearchIndexTasks",
    register(container: Container) {
        container.register(ReindexRunner);
        container.register(ReindexTask);
        container.register(EnableIndexingRunner);
        container.register(EnableIndexingTask);
        container.register(CreateIndexesRunner);
        container.register(OnBeforeTrigger);
        container.register(CreateIndexesTask);
    }
});
```

### Bridge feature

```typescript
export const SearchIndexTasksDdbOsFeature = createFeature({
    name: "SearchIndexTasksDdbOs",
    register(container: Container) {
        container.register(DdbStorageScanner);
        container.register(DdbStorageWriter);
        container.register(OsIndexManager);
        container.register(IndexSettingsManager);
        container.register(DisableIndexing);
        container.register(EnableIndexing);
        container.register(IndexManagerFactory);
    }
});
```

### Consumer wiring

```typescript
SearchIndexTasksFeature.register(container);
SearchIndexTasksDdbOsFeature.register(container);
```

## Migration

### Phase 1 (this work)

- Create both new packages with full implementations and tests
- Move relevant tests from `api-elasticsearch-tasks` to new packages
- `api-elasticsearch-tasks` becomes thin wrapper:
  - Re-exports composed feature (SearchIndexTasks + SearchIndexTasksDdbOs + dataSynchronization)
  - Keeps `dataSynchronization` task and its dependencies
- Existing consumers continue importing from `api-elasticsearch-tasks` unchanged

### Phase 2 (future)

- Migrate consumers to import from new packages directly
- Decide fate of `dataSynchronization` (move or delete)
- Delete `api-elasticsearch-tasks`

## Tests

Tests live in new packages, not in `api-elasticsearch-tasks`.

- `api-search-index-tasks` — unit tests with mock scanner/writer/manager
- `api-search-index-tasks-ddb-os` — integration tests with real DynamoDB + OpenSearch

## Rules

- No standalone `types.ts` files — all types declared as interfaces before namespace, namespace re-exports only
- One abstraction/implementation/feature per file
- Task IDs preserved for backward compat with existing DB records
- `sync-to-opensearch` integration stays outside bridge, loaded separately
- Opaque string cursor for scanner pagination
