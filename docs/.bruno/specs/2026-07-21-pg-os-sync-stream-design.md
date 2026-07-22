# PG-to-OpenSearch Sync Stream Pipeline

## Problem

CMS entry writes in the pg-os backend write to the `os_sync` PG table via `SyncWriter`, but nothing reads those rows and pushes them to OpenSearch. We need the PG equivalent of DynamoDB Streams: a mechanism that captures every change to `os_sync` (INSERT, UPDATE, DELETE) and feeds a handler that syncs to OS.

## Architecture

### Single table: `os_sync`

Source of truth for what OS should contain. Rows upserted for entries that should be indexed. Rows deleted when entries are removed from OS. If OS dies or indexes are lost, a background task re-reads `os_sync` and rebuilds indexes.

**SyncWriter change required:** `SyncWriter` currently upserts rows with `operation: REMOVE` and `data: JSON.stringify({})`. This must change to DELETE the row from os_sync instead. Rationale: os_sync only holds entries that should exist in OS. A REMOVE row would corrupt reindex (reindex reads all rows and pushes to OS — a REMOVE row would be treated as a valid entry). The simulation then captures the SQL DELETE to produce a REMOVE `SyncEvent`.

### Stream simulation (test + dev)

Intercepts knex operations on the `os_sync` table. On every INSERT/UPDATE/DELETE, captures a `SyncEvent` and calls a handler synchronously (same pattern as `packages/project-utils/testing/dynamodb/processing.js` which intercepts DynamoDB document client commands).

### Production stream (future)

PG logical replication slot on `os_sync` table produces the same `SyncEvent` shape. A worker process reads the slot and calls the same handler. Not in scope for this spec.

## Components

### 1. `SyncEvent` type

```typescript
interface SyncEvent {
    type: "INSERT" | "MODIFY" | "REMOVE";
    id: string;        // os_sync row id, e.g. "entry1:L"
    entryId: string;
    tenant: string;
    index: string;     // OS index name
    data?: string;     // compressed JSON doc string; absent for REMOVE
}
```

Location: `api-headless-cms-pg-os/src/types.ts` (alongside `ISyncRow`).

**Mapping from `ISyncRow`:** `simulatePgStream` converts `ISyncRow` fields directly to `SyncEvent` fields. `SyncEvent.type` reflects the SQL operation on os_sync (INSERT for new row, MODIFY for updated row via upsert, REMOVE for deleted row). Since SyncWriter now DELETEs rows for remove operations (instead of upserting with operation=REMOVE), the `ISyncRow.operation` field is always MODIFY for rows that exist in the table. The handler uses `SyncEvent.type` to decide whether to index (INSERT/MODIFY) or delete from OS (REMOVE).

**INSERT vs MODIFY distinction:** `SyncWriter` uses upsert (`insert().onConflict().merge()`) for write operations and DELETE for remove operations. For upserts, the simulation detects whether the row existed before to distinguish INSERT (new row) from MODIFY (existing row updated). In practice, the handler treats INSERT and MODIFY identically — both decompress data and push to OS. The distinction exists for observability and to match the DynamoDB Streams event shape.

### 2. `SyncEventHandler`

Receives a batch of `SyncEvent[]`, decompresses data, feeds `SynchronizationBuilder` from `@webiny/api-sync-to-opensearch`, flushes to OS.

```
SyncEvent[] -> for each event:
    INSERT/MODIFY: decompress event.data -> builder.insert({ id, index, data })
    REMOVE: builder.delete({ id, index })
-> builder.build()  (returns an async flush function)
-> await flush()    (sends bulk request to OS)
```

`SynchronizationBuilder.build()` returns an async function that executes the OS bulk operation. The handler calls `build()` then immediately invokes the returned function.

**Batch control:** The `batchSize` option controls how many events the handler accumulates into one `SynchronizationBuilder` before flushing. If 100 events arrive and `batchSize` is 25, the handler creates 4 sequential flushes of 25 events each. This prevents oversized OS bulk requests.

Location: `api-headless-cms-pg-os/src/features/syncEventHandler/`

DI structure:
- `abstractions.ts` — `SyncEventHandler` abstraction with `process(events: SyncEvent[], options?: { batchSize?: number }): Promise<void>`
- `SyncEventHandler.ts` — implementation, depends on `SynchronizationBuilder`, `CompressionHandler`
- `feature.ts` — DI registration

### 3. `simulatePgStream`

Test utility that intercepts knex writes to `os_sync`, captures stream events, and calls a handler.

```typescript
function simulatePgStream(
    knex: Knex,
    tableName: string,
    handler: (events: SyncEvent[]) => Promise<void>
): void
```

Intercepts knex operations targeting the specified table name:
- **Upsert (new row)**: `insert().onConflict().merge()` where row did not exist before. Captures as `{type: "INSERT", id, entryId, tenant, index, data}`.
- **Upsert (existing row)**: `insert().onConflict().merge()` where row existed before. Captures as `{type: "MODIFY", id, entryId, tenant, index, data}`.
- **DELETE**: Reads row BEFORE delete to capture `{type: "REMOVE", id, entryId, tenant, index}` (no data).

Calls handler synchronously after each intercepted operation with the captured events (may be multiple events per operation, e.g. `SyncWriter.writeEntry` upserts 1-2 rows).

Implementation: Monkey-patch the knex query builder for the specific table, same approach as DDB simulation patching `documentClient.send`. The patch intercepts the `.then()` or `.toSQL()` chain to detect table name and operation type.

Location: `api-headless-cms-pg-os/src/testing/simulatePgStream.ts`

### 4. Reindex path

Reads all rows from `os_sync`, creates synthetic INSERT events, feeds the same `SyncEventHandler`. Used when OS indexes are rebuilt from scratch.

```typescript
async function createReindexEvents(knex: Knex, tableName: string): Promise<SyncEvent[]>
```

Not a separate component — a utility function. Future spec will detail the background task that orchestrates reindexing.

## Test Strategy

### Infrastructure

- **PG**: PGlite + pglite-socket + knex (existing pattern from `syncTableManager.test.ts`)
- **OS**: Real OpenSearch via `createTestOpenSearchClient` from `@webiny/api-opensearch/testing`. Connects to `localhost:9200` (env: `OPENSEARCH_PORT`, `OPENSEARCH_ENDPOINT`).
- **DI Container**: New test setup function that extends existing pattern (KnexClient, TableNameResolverConfig, TableNameResolverFeature, SyncTableManagerFeature, CompressionFeature) with additional registrations for OS sync: `OpenSearchClient` (wrapping test client), `SynchronizationBuilder` feature dependencies (`Timer`, `ExecuteSync`, `OperationsFactory`), and `SyncEventHandler` feature. Existing tests are not modified — new tests use their own setup.
- **Tests run with**: `yarn test:os` (requires OpenSearch running locally or in CI).

### Test cases

1. **INSERT event sync**: SyncWriter writes a latest entry -> simulation captures INSERT event -> handler pushes to OS -> verify document exists in OS index with correct fields.

2. **MODIFY event sync**: SyncWriter writes entry, then updates it -> simulation captures INSERT then MODIFY -> handler pushes both -> verify OS has updated document.

3. **REMOVE event sync**: SyncWriter writes entry, then removes it -> simulation captures INSERT then REMOVE -> handler pushes create then delete -> verify document absent from OS index.

4. **Batch processing**: Write N entries -> simulation captures N events -> handler processes with configurable batchSize (e.g. batchSize=2 with 5 events = 3 flushes) -> verify all N documents in OS.

5. **Published + latest**: SyncWriter writes both latest and published records -> verify both documents appear in OS with correct TYPE (cms.entry.l / cms.entry.p).

6. **Reindex path**: Populate os_sync with multiple entries via direct knex inserts (bypassing simulation) -> call `createReindexEvents` -> feed to handler -> verify all documents rebuilt in OS.

## Dependencies

- `@webiny/api-sync-to-opensearch` — `SynchronizationBuilder`, `Operations`, `ExecuteSync`, `OperationsFactory`
- `@webiny/api-opensearch` — `OpenSearchClient`, test utilities
- `@webiny/utils` — `CompressionHandler`
- `@webiny/api-headless-cms-utils-os` — `CmsEntryOpenSearchFieldIndexRegistry`, index configurations
- `@electric-sql/pglite`, `@electric-sql/pglite-socket` — test PG

## Out of scope

- Production PG logical replication consumer
- Background reindex task orchestration
- LISTEN/NOTIFY trigger setup for production
- Deployment / infrastructure configuration
