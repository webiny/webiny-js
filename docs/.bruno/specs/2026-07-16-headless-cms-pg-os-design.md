# Headless CMS PG+OpenSearch Storage Stack

**Date:** 2026-07-16
**Status:** Draft
**Scope:** Three packages — shared OpenSearch query infrastructure, PG+OS CMS storage, and PG-to-OpenSearch WAL-based sync adapter.

## Problem

`api-headless-cms-ddb-es` bundles two independent concerns: DynamoDB storage operations and OpenSearch query infrastructure (field indexing, filtering, sorting, FTS, query building). A new PostgreSQL+OpenSearch storage variant cannot reuse the OpenSearch query layer without duplicating ~40 files from `ddb-es`.

## Solution

Three new packages, built in order:

1. **`@webiny/api-headless-cms-utils-os`** — Shared OpenSearch query infrastructure extracted from `ddb-es`. Zero AWS/DDB deps.
2. **`@webiny/api-sync-pg-to-opensearch`** — WAL-based sync adapter. Receives pre-formatted OS documents from a PG sync table, pushes to OpenSearch. Follows the same pattern as `api-sync-ddb-to-opensearch`.
3. **`@webiny/api-headless-cms-pg-os`** — CMS storage using PostgreSQL for primary storage (writes + point reads) and OpenSearch for list/search. Dual-writes to a PG sync table with OS-ready documents.

After extraction, `ddb-es` is refactored to depend on `utils-os` (no behavior change, all 110 tests stay green).

## Architecture Decisions

### Dual-Write Pattern (same as ddb-es)

PG-OS follows the same dual-write pattern as DDB-ES:
- **ddb-es:** Writes to DDB main table + DDB ES sync table. DDB Streams triggers Lambda which pushes pre-formatted documents to OpenSearch.
- **pg-os:** Writes to PG main table + PG sync table. WAL on sync table triggers sync adapter which pushes pre-formatted documents to OpenSearch.

The write path prepares OS-ready documents using `transformEntryToIndex` and `prepareEntryToIndex` from `utils-os`, compresses them, and writes to the sync table. The sync adapter is intentionally simple — it receives pre-formatted data.

### Read Path Split

Same split as ddb-es:
- **Point reads** (`get`, `getByIds`, `getRevisions`, `getPreviousRevision`, etc.) hit PostgreSQL directly.
- **List/search** (`list`, `getUniqueFieldValues`) hit OpenSearch using shared query infrastructure from `utils-os`.

### Model/Group Operations

Passthrough to `api-headless-cms-sql`. Models and groups are small lists — no OpenSearch needed.

### Reuse of sql Package

`api-headless-cms-pg-os` depends on `api-headless-cms-sql` for:
- PG entry write operations (knex patterns, `entryToRow`/`rowToEntry` mappers)
- Model/group storage operations (direct passthrough)
- Table management (EntryTableManager, TableNameResolver, SchemaManagers)

Entry write operations extend the sql package's operations to add the sync table dual-write.

---

## Package 1: `@webiny/api-headless-cms-utils-os`

### Purpose

Shared OpenSearch query and indexing infrastructure. Used by both `ddb-es` and `pg-os`. Zero AWS dependencies.

### File Structure

```
packages/api-headless-cms-utils-os/
  src/
    features/
      CmsEntryOpenSearchFieldIndex/       # 8 field indexers + registry
        abstractions/
          CmsEntryOpenSearchFieldIndex.ts
          CmsEntryOpenSearchFieldIndexRegistry.ts
        fields/
          DefaultFieldIndex.ts
          DateTimeFieldIndex.ts
          NumberFieldIndex.ts
          LongTextFieldIndex.ts
          TextCompressedFieldIndex.ts
          RichTextFieldIndex.ts
          TextEncryptedFieldIndex.ts
          JsonFieldIndex.ts
          ObjectFieldIndex.ts
        CmsEntryOpenSearchFieldIndexRegistry.ts
        feature.ts
      CmsEntryOpenSearchFilter/           # 3 filters + registry
        abstractions/
          CmsEntryOpenSearchFilter.ts
          CmsEntryOpenSearchFilterRegistry.ts
        fields/
          DefaultFilter.ts
          ObjectFilter.ts
          RefFilter.ts
        CmsEntryOpenSearchFilterRegistry.ts
        feature.ts
      CmsEntryOpenSearchValueSearch/      # 3 searchers + registry
        abstractions/
          CmsEntryOpenSearchValueSearch.ts
          CmsEntryOpenSearchValueSearchRegistry.ts
        fields/
          RefSearch.ts
          TimeSearch.ts
          SearchableJsonSearch.ts
        CmsEntryOpenSearchValueSearchRegistry.ts
        feature.ts
      CmsEntryOpenSearchIndex/            # index config + base impl
        abstractions.ts
        BaseOpenSearchIndex.ts
        feature.ts
      CmsEntryOpenSearchBodyModifier/     # query body hook
        abstractions.ts
      CmsEntryOpenSearchSortModifier/     # sort clause hook
        abstractions.ts
      CmsEntryOpenSearchQueryModifier/    # query transform hook
        abstractions.ts
      CmsEntryOpenSearchFullTextSearch/   # FTS config
        abstractions.ts
      CmsEntryOpenSearchValuesModifier/   # entry value transform
        abstractions.ts
    operations/
      entry/
        elasticsearch/
          body.ts                         # query body builder
          fields.ts                       # field mapping
          fields/                         # system fields (state, live, location)
          filtering/                      # filter application (5 files)
          fullTextSearch.ts               # FTS
          sort.ts                         # sort builder
          plugins/operator.ts             # operators
          initialQuery.ts                 # query template
          assignMinimumShouldMatchToQuery.ts
          keyword.ts                      # keyword handling
          transformValueForSearch.ts      # value transform
          shouldIgnoreEsResponseError.ts  # error handling
          types.ts                        # query types
    transformations/
      transformEntryToIndex.ts            # entry -> OS document (strips storage keys)
      compressEntryData.ts               # compress latest/published entry data
    elasticsearch/
      createElasticsearchIndex.ts         # index lifecycle
      deleteElasticsearchIndex.ts
    helpers/
      entryIndexHelpers.ts                # prepareEntryToIndex, extractFromIndex
      fieldIdentifier.ts                  # field ID resolution
    values/
      NoValueContainer.ts                 # missing value marker
    configurations.ts                     # index naming + settings
    index.ts                              # barrel export
    exports/
      api/
        cms/
          opensearch.ts                   # public re-exports (12 abstractions)
```

### Dependencies

```json
{
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-headless-cms-storage": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
}
```

### Extraction Rules

- All files move with their directory structure intact.
- Import paths change from `~/` local to `@webiny/api-headless-cms-utils-os/` in `ddb-es`.
- No logic changes. Pure move.
- The `exports/api/cms/opensearch.ts` re-export file moves from `ddb-es` to `utils-os`.

---

## Package 2: `@webiny/api-sync-pg-to-opensearch`

### Purpose

WAL-based sync adapter. Receives pre-formatted OS documents from PG sync table changes, pushes to OpenSearch with retry and health checks. Follows the `api-sync-ddb-to-opensearch` pattern.

### File Structure

```
packages/api-sync-pg-to-opensearch/
  src/
    features/
      PgOperationsBuilder/
        implementation.ts                 # transforms PG sync rows -> OS bulk ops
        feature.ts
      PgToOpenSearchHandler/
        implementation.ts                 # WAL event handler
        feature.ts
      PgToOpenSearchFeature.ts            # composite: registers base + PG features
    createPgToOpenSearchHandler.ts        # factory function
    index.ts                              # barrel export
```

### PgOperationsBuilder

Implements `OperationsBuilder` abstraction from `api-sync-to-opensearch` base package. Receives PG sync table rows (which contain pre-formatted, compressed OS documents) and converts them to OpenSearch bulk operations.

The sync table row contains:
- `id` — entry revision ID
- `index` — target OpenSearch index name
- `data` — compressed OS-ready document (prepared by `pg-os` write path)
- `operation` — INSERT/MODIFY/REMOVE (matches `OperationType` enum from `api-sync-to-opensearch`)

The builder reads these fields and calls `operations.insert()`, `operations.modify()`, or `operations.delete()` — same as `DdbOperationsBuilder` but without DDB unmarshalling.

### PgToOpenSearchHandler

Processes WAL change events. Resolves `OperationsBuilder`, builds operations from event records, executes with retry via `ExecuteSyncWithRetry`.

### PgToOpenSearchFeature (Composite)

Registers all dependencies:
- Base sync features: `ExecuteSyncFeature`, `ExecuteSyncWithRetryFeature`, `SynchronizationBuilderFeature`
- PG-specific: `PgOperationsBuilderFeature`, `PgToOpenSearchHandlerFeature`
- External: `OpenSearchClientFeature`, `CompressionFeature`

### Dependencies

```json
{
    "@webiny/api-sync-to-opensearch": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
}
```

Zero AWS deps. No DDB deps.

### WAL Integration

WAL capture mechanism is environment-specific (not part of this package). The handler receives change events in a defined format — the WAL listener is wired at the infrastructure level (deployment config).

---

## Package 3: `@webiny/api-headless-cms-pg-os`

### Purpose

CMS storage using PostgreSQL for primary storage and OpenSearch for list/search. Dual-writes to PG sync table for WAL-based OS synchronization.

### File Structure

```
packages/api-headless-cms-pg-os/
  src/
    features/
      syncTableManager/
        abstractions.ts                   # SyncTableManager abstraction
        SyncTableManager.ts               # implementation: lazy table create
        feature.ts
      HeadlessCmsPgOsFeature.ts           # composite feature
    operations/
      entry/
        index.ts                          # createEntriesStorageOperations()
        write.ts                          # PG main table + sync table dual-write
        read.ts                           # PG point reads (delegates to sql ops)
        list.ts                           # OS query via utils-os
        syncWriter.ts                     # prepares OS doc, writes to sync table
      model/
        index.ts                          # passthrough to sql package
      group/
        index.ts                          # passthrough to sql package
    index.ts                              # barrel export
```

### SyncTableManager

Manages the PG sync table lifecycle (lazy creation, schema). Similar to `EntryTableManager` from the sql package.

**Sync table schema:**
```sql
CREATE TABLE IF NOT EXISTS cms_os_sync (
    id          TEXT PRIMARY KEY,       -- entry revision ID + record type
    entry_id    TEXT NOT NULL,          -- groups revisions
    index       TEXT NOT NULL,          -- target OS index name
    operation   TEXT NOT NULL,          -- INSERT/MODIFY/REMOVE
    data        TEXT NOT NULL,          -- compressed OS-ready document
    tenant      TEXT NOT NULL,
    created_on  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sync_tenant ON cms_os_sync(tenant);
```

### Entry Write Operations (Dual-Write)

Each write operation (create, update, publish, unpublish, delete, move, etc.):

1. **PG main table write** — Delegates to sql package's entry operations (`entryToRow` + knex insert/update/delete).
2. **Prepare OS document** — Uses `prepareEntryToIndex()` and `compressEntryData()` from `utils-os` to create the OS-ready document.
3. **Sync table write** — Writes the compressed document to `cms_os_sync` with the appropriate operation type.

For operations that affect multiple records (e.g., publish changes both latest and published):
- Latest record: `{ id: "{entryId}:L", operation: "MODIFY", data: compressedLatest }`
- Published record: `{ id: "{entryId}:P", operation: "INSERT", data: compressedPublished }`

Delete operations write `{ operation: "REMOVE" }` to the sync table.

### Entry Point Reads

`get`, `getByIds`, `getRevisions`, `getPreviousRevision`, `getLatestRevisionByEntryId`, `getPublishedRevisionByEntryId`, `getRevisionById`, `getPublishedByIds`, `getLatestByIds` — all delegate to sql package's PG operations. No OS involvement.

### Entry List/Search

`list` and `getUniqueFieldValues` use the shared OpenSearch query infrastructure from `utils-os`:

1. Build OS query body using `body.ts` builder
2. Apply filters via `CmsEntryOpenSearchFilter` registry
3. Apply sorting via `sort.ts` builder
4. Apply FTS via `fullTextSearch.ts`
5. Execute query against OpenSearch client
6. Transform results via `extractEntriesFromIndex()`

Same logic as `ddb-es` list operations, but the code lives in `utils-os`.

### Model/Group Operations

Direct passthrough to `api-headless-cms-sql`:
```ts
const models = createModelsStorageOperations(/* sql params */);
const groups = createGroupsStorageOperations(/* sql params */);
```

No wrapping. No OS involvement.

### Composite Feature

`HeadlessCmsPgOsFeature` registers:
- SQL features: `TableNameResolverFeature`, `GroupSchemaManagerFeature`, `ModelSchemaManagerFeature`, `EntryTableManagerFeature`, `ValueFilterFeature`
- OS features: `CmsEntryOpenSearchIndexFeature`, `CmsEntryOpenSearchFieldIndexFeature`, `CmsEntryOpenSearchFilterFeature`, `CmsEntryOpenSearchValueSearchFeature`
- Sync table: `SyncTableManagerFeature`
- External: `OpenSearchClientFeature`, `CompressionFeature`
- Factory: `StorageOperationsFactory` for pg-os

### Dependencies

```json
{
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-headless-cms-sql": "0.0.0",
    "@webiny/api-headless-cms-utils-os": "0.0.0",
    "@webiny/api-headless-cms-storage": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
}
```

Zero AWS deps.

---

## ddb-es Refactor

After `utils-os` extraction:

### What Changes

- All OpenSearch imports switch from `~/features/CmsEntry*` and `~/operations/entry/elasticsearch/` to `@webiny/api-headless-cms-utils-os/`.
- `src/features/` directory empties (all 9 feature directories move).
- `src/operations/entry/elasticsearch/` directory moves.
- `src/helpers/entryIndexHelpers.ts` and `src/helpers/fieldIdentifier.ts` move.
- `src/values/` moves.
- `src/configurations.ts` moves.
- `src/elasticsearch/` moves.
- `src/exports/api/cms/opensearch.ts` re-exports from `utils-os` instead of local paths.
- `src/operations/entry/transformations/transformEntryToIndex.ts` and compression helpers move.

### What Stays

- `src/definitions/` — DDB entity schemas
- `src/operations/entry/dataLoader/` — DDB batch loaders
- `src/operations/entry/keys.ts` — DDB key builders
- `src/operations/entry/recordType.ts` — record type markers
- `src/operations/entry/transformations/transformEntryKeys.ts` — DDB key transforms
- `src/operations/entry/transformations/convertEntryKeys.ts` — DDB key conversion
- `src/operations/entry/transformations/modifyEntryValues.ts` — value mod application
- `src/operations/entry/index.ts` — main entry ops (imports from utils-os)
- `src/operations/model/` and `src/operations/group/` — DDB model/group ops
- `src/feature.ts` — composite feature (imports from utils-os)
- `src/index.ts` — barrel export
- `src/tasks/` — background tasks
- `src/types.ts`

### Validation

All 110 existing tests must pass unchanged. Behavior is identical — only import sources change.

New dependency added:
```json
"@webiny/api-headless-cms-utils-os": "0.0.0"
```

---

## Testing Strategy

### `api-headless-cms-utils-os`

- Unit tests for query body builder, filter application, sort builder, FTS.
- Unit tests for entry-to-index transformations and compression.
- Migrate relevant isolated tests from ddb-es.
- No integration tests needed — pure logic, no external services.

### `api-headless-cms-ddb-es` (post-refactor)

- Run existing 110 tests with `yarn test:os`. All must pass.
- No new tests — behavior unchanged.

### `api-sync-pg-to-opensearch`

- Unit tests for `PgOperationsBuilder` — verify PG sync rows convert to correct OS bulk operations.
- Integration tests with OpenSearch for end-to-end sync verification.
- Follow `api-sync-ddb-to-opensearch` test patterns.

### `api-headless-cms-pg-os`

- Test infrastructure: `createPgliteClient()` (from sql package) + OS test client.
- Test setup: use `api-sync-pg-to-opensearch` handler to sync data from PG sync table to OS (like ddb-es uses `simulateStream`).
- Entry CRUD tests: verify PG writes + sync table population.
- Entry list/search tests: verify OS queries return correct results.
- Model/group tests: verify passthrough works.
- Port filtering tests from ddb-es (adapted for PG+OS).
- `ci.config.json` with appropriate storage ops preset.

---

## Build Order

1. **`api-headless-cms-utils-os`** — extract from ddb-es, validate with ddb-es tests
2. **Refactor `ddb-es`** — depend on utils-os, validate 110 tests green
3. **`api-sync-pg-to-opensearch`** — WAL sync adapter with tests
4. **`api-headless-cms-pg-os`** — PG+OS storage with full test suite

Each step is independently shippable and testable.

---

## Out of Scope

- WAL listener infrastructure (deployment/infra concern, not application code)
- Query builder/sorter extraction from CMS core (noted for future — `CmsWhereMapper`, `CmsSortMapper` abstractions exist in `api-headless-cms`)
- Background tasks migration to use `@webiny/utils` Timer (follow-up from PR #5413)
- Consumer updates (project templates, deployment configs for PG+OS variant)
