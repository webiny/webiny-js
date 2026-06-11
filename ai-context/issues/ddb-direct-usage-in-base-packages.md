# Direct DynamoDB Usage in Base Packages

> **Goal:** All base `api-*` packages must be storage-agnostic. DynamoDB code
> belongs in dedicated `-ddb` packages (e.g. `api-aco-ddb`). This document
> lists every base package that still references DynamoDB directly.

## Reference pattern

`packages/api-aco` defines abstractions; `packages/api-aco-ddb` implements
them with DynamoDB. All base packages should follow this split.

## Search method

- `codegraph_search` for `DocumentClient` / `DynamoDBDocumentClient`
- `grep` for `DocumentClient`, `DynamoDBDocument`, `getDocumentClient`,
  `@webiny/db-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-dynamodb`
  across `packages/api-*/src/` and `packages/api-*/package.json`
- Excluded: `*-ddb*`, `*-so*`, `db-dynamodb`, `aws-sdk`, `project-*` packages

## Findings

### 1. Stale `package.json` deps only (no source usage)

These packages list DDB dependencies but have **zero** DDB imports in `src/`.
Fix: remove the deps from `package.json`.

| Package            | Stale deps                               |
| ------------------ | ---------------------------------------- |
| `api-core`         | `@webiny/db-dynamodb`                    |
| `api-headless-cms` | `@webiny/aws-sdk`, `@webiny/db-dynamodb` |
| `api-mailer`       | `@webiny/db-dynamodb`                    |

### 2. `api-opensearch` — DDB entity/table in source

**Files:**

- `src/db/entity.ts` — imports `createEntity`, `ITable`, `standardEntityAttributes` from `@webiny/db-dynamodb`
- `src/db/types.ts` — imports `IEntity`, `IStandardEntityAttributes` from `@webiny/db-dynamodb`
- `src/db/table.ts` — imports `DynamoDBDocument` from `@webiny/aws-sdk`, uses `createTable` from `@webiny/db-dynamodb`

**Scope:** Entire `src/db/` directory is DDB-specific. Needs abstraction or
extraction to a separate `-ddb` package.

### 3. `api-elasticsearch-tasks` — DocumentClient throughout

**Files:**

- `src/types.ts` — `DynamoDBDocument` in config interfaces (`IElasticsearchTaskConfig`)
- `src/tasks/Manager.ts` — stores `documentClient` as a public property
- `src/helpers/getClients.ts` — calls `getDocumentClient()` directly
- `src/tasks/enableIndexing/index.ts` — constructor receives `documentClient`
- `src/tasks/reindexing/reindexingTaskDefinition.ts` — constructor receives `documentClient`
- `src/tasks/dataSynchronization/DataSynchronizationTask.ts` — constructor receives `documentClient`
- `src/tasks/createIndexes/CreateIndexesTask.ts` — constructor receives `documentClient`

**Scope:** DDB is woven into core interfaces and every task class. The task
manager, all task constructors, and the client helper need abstraction.

### 4. `api-scheduler` — DDB in context and manifest

**Files:**

- `src/context.ts` — casts `context.db.driver.getClient()` to `DynamoDBDocument`
- `src/manifest.ts` — uses `DynamoDBDocument` type, calls `ServiceDiscovery.setDocumentClient()`

**Scope:** Small surface. Two files with direct DDB client usage.

### 5. `api-websockets` — Hardcoded DDB entity and registry

**Files:**

- `src/registry/entity.ts` — `createEntity(documentClient: DynamoDBDocument)` using toolbox Entity
- `src/registry/WebsocketsConnectionRegistry.ts` — constructor takes `DynamoDBDocument`, creates entity

**Scope:** The entire connection registry is DDB-specific. Needs abstraction
interface + extraction to a storage-specific package.

### 6. `api-sync-system` — Heaviest offender (8 files)

**Files:**

- `src/sync/attachToDynamoDbDocument.ts` — decorates DDB client with sync interceptors
- `src/sync/createSyncSystem.ts` — `getDocumentClient()` in params interface
- `src/sync/requestPlugin.ts` — `getDocumentClient()` in params interface
- `src/sync/utils/manifest.ts` — calls `ServiceDiscovery.setDocumentClient()`
- `src/resolver/createEventHandlerPlugin.ts` — `createDocumentClient` factory param, multiple usages
- `src/resolver/createResolverHandler.ts` — `createDocumentClient` factory param
- `src/resolver/app/fetcher/Fetcher.ts` — `IFetcherParamsCreateDocumentClientCallable` interface
- `src/resolver/app/storer/Storer.ts` — likely similar pattern

**Scope:** DDB is fundamental to how sync-system works. The sync interceptor
(`attachToDynamoDbDocument`) decorates the DDB client directly. This is the
largest refactoring effort.

## Summary

| Package                   | Severity               | Effort                                                                       |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `api-core`                | Stale dep only         | Trivial — remove from `package.json`                                         |
| `api-headless-cms`        | Stale dep only         | Trivial — remove from `package.json`                                         |
| `api-mailer`              | Stale dep only         | Trivial — remove from `package.json`                                         |
| `api-opensearch`          | Source usage (3 files) | Small — extract `src/db/` to `-ddb` package                                  |
| `api-scheduler`           | Source usage (2 files) | Small — abstract client access                                               |
| `api-websockets`          | Source usage (2 files) | Medium — abstract connection registry                                        |
| `api-elasticsearch-tasks` | Source usage (7 files) | Medium — abstract task config interfaces                                     |
| `api-sync-system`         | Source usage (8 files) | Large — DDB is architectural; sync interceptor decorates DDB client directly |
