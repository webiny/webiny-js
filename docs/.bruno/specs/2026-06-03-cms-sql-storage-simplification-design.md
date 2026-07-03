# CMS SQL Storage Simplification

## Motivation

The current `api-headless-cms-sql` package implements a full relational storage layer: table-per-model, dynamic column management, SQL WHERE builders, operator registries, filter registries, keyset pagination, and schema diffing with ALTER TABLE. This complexity is unnecessary for the target use case — SQLite for small projects — and is the primary source of the 42 remaining test failures.

The DDB-only system already solves filtering by loading all entries for a model and filtering in application code. The same approach works for SQLite at small scale, and eliminates the entire SQL query-building layer.

## Goals

- Store entry data the same way as the DDB system (flat system columns + values blob).
- Load all matching entries and filter/sort/paginate in application code.
- Extract DDB's filtering utilities into a shared package so both storage backends use the same code.
- Ship fast — minimize moving parts.

## Non-Goals

- SQL-level query optimization (not needed at SQLite scale).
- Support for millions of entries (that's what DDB+OpenSearch is for).
- Backwards compatibility with the current SQL table schema.

---

## Package Changes

### 1. New Package: `@webiny/db-utils`

Shared filtering, sorting, and value comparison utilities extracted from `api-headless-cms-ddb`. Zero DynamoDB dependencies.

```
packages/db-utils/src/
├── valueFilter/
│   ├── abstractions.ts              -- ValueFilter + ValueFilterRegistry abstractions
│   └── feature.ts                   -- DI registration
├── filtering/
│   ├── filter.ts                    -- run expression tree against records
│   ├── sort.ts                      -- in-memory sort (lodash sortBy, single-field only)
│   ├── fullTextSearch.ts            -- term matching across fields
│   ├── getValue.ts                  -- recursive dot-path value extraction
│   ├── transform.ts                 -- value transformation wrapper
│   ├── mapPlugins.ts                -- generic plugin-container utility (maps plugins by key)
│   ├── expressions/
│   │   ├── createExpressions.ts     -- compile where input into expression tree
│   │   ├── where.ts                 -- parse "field_not_in" into { fieldId, op, negate }
│   │   └── values.ts               -- AND/OR array validation
│   ├── fields/
│   │   ├── createFields.ts          -- build Field lookup from model fields
│   │   ├── systemFields.ts          -- system/meta fields as filterable
│   │   ├── extractSort.ts           -- parse sort string into field + direction
│   │   └── types.ts                 -- Field, FieldParent, FilterItemFromStorage
│   └── plugins/
│       ├── defaultFilterCreate.ts
│       ├── refFilterCreate.ts
│       ├── objectFilterCreate.ts
│       ├── searchableJsonFilterCreate.ts
│       └── index.ts
├── plugins/
│   ├── FieldFilterPlugin.ts
│   ├── FieldSortingPlugin.ts
│   ├── FieldFilterPathPlugin.ts
│   └── FieldFilterValueTransformPlugin.ts
├── path/
│   ├── plainObject.ts
│   └── locationFolderId.ts
└── transforms/
    └── datetime.ts                  -- self-contained date/time parsing (both datetime + time branches)
```

**Origin of each file group:**

| Destination | Source |
|---|---|
| `valueFilter/` | `@webiny/db-dynamodb` — ValueFilter + ValueFilterRegistry abstractions |
| `filtering/` | `api-headless-cms-ddb/src/operations/entry/filtering/` |
| `plugins/` | `api-headless-cms-ddb/src/plugins/` (base classes) |
| `path/` | `api-headless-cms-ddb/src/dynamoDb/path/` |
| `transforms/datetime.ts` | `api-headless-cms-ddb/src/dynamoDb/transformValue/datetime.ts` (rewritten to remove `@webiny/db-dynamodb` imports — the logic is just `date-fns` parsing + integer math) |

**DDB coupling resolved:**

- `ValueFilter` and `ValueFilterRegistry` abstractions move from `@webiny/db-dynamodb` to `@webiny/db-utils`.
- `filter.ts`, `createExpressions.ts`, `fullTextSearch.ts`, and `FieldFilterPlugin.ts` import these abstractions from `@webiny/db-utils` instead of `@webiny/db-dynamodb`.
- `datetime.ts` transform is rewritten with inline date/time parsing logic — contains both `datetime` (via `date-fns/parseISO`) and `time` (integer math) branches. No `TimeTransformPlugin`/`DateTimeTransformPlugin` imports.

**Signature changes for extraction:**

- `filter()` currently takes `container: CmsContext["container"]` and resolves `ValueFilterRegistry` via DI. After extraction, `filter()` accepts `valueFilterRegistry: ValueFilterRegistry.Interface` directly as a parameter — callers resolve it from their own container before calling.
- `createExpressions()` same change — receives `valueFilterRegistry` as a param instead of resolving from container.
- `sort()` enforces single-field sorting (same as DDB). Multi-field sort is not supported.

**DI wiring requirement:**

Both `api-headless-cms-ddb` and `api-headless-cms-sql` must register the `ValueFilterFeature` from `@webiny/db-utils` in their DI container so that the `ValueFilterRegistry` is available for resolution. The SQL package's `registerSqlStorageOperations()` must include this feature registration.

---

### 2. Rewritten: `@webiny/api-headless-cms-sql`

#### Table Schema

Three fixed-schema tables, named `{prefix}webiny_cms_entries{suffix}`, `{prefix}webiny_cms_groups{suffix}`, `{prefix}webiny_cms_models{suffix}`. Prefix and suffix are optional.

**`webiny_cms_entries`** — one row per revision:

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT, PK | `"entryId#version"` |
| `entryId` | TEXT, indexed | bare entry ID |
| `modelId` | TEXT, indexed | model identifier |
| `tenant` | TEXT, indexed | tenant identifier |
| `version` | INTEGER | revision number |
| `status` | TEXT | `"draft"` / `"published"` / `"unpublished"` |
| `locked` | BOOLEAN | set on publish |
| `isLatest` | BOOLEAN, indexed | one per entryId |
| `isPublished` | BOOLEAN, indexed | zero or one per entryId |
| `wbyDeleted` | BOOLEAN | bin flag |
| `binOriginalFolderId` | TEXT | original folder before bin |
| `location` | TEXT | JSON `{ folderId }` |
| `location_folderId` | TEXT | denormalized for inspection |
| `revisionCreatedOn` ... `revisionLastPublishedOn` | TEXT | 7 revision-level dates |
| `revisionCreatedBy` ... `revisionLastPublishedBy` | TEXT | 7 revision-level identity JSON blobs |
| `createdOn` ... `lastPublishedOn` | TEXT | 7 entry-level dates |
| `createdBy` ... `lastPublishedBy` | TEXT | 7 entry-level identity JSON blobs |
| `meta` | TEXT | JSON |
| `system` | TEXT | JSON |
| `live` | TEXT | JSON `{ version }` |
| `revisionDescription` | TEXT | |
| `expiresAt` | BIGINT | TTL |
| `values` | TEXT | JSON blob of all field values |

No flattened identity columns (`_id`, `_displayName`, `_type`) — those were only needed for SQL WHERE clauses, which are gone. In-memory filtering reads properties from the parsed entry object.

**Composite indexes:**
- `(tenant, modelId, isLatest)`
- `(tenant, modelId, isPublished)`
- `(tenant, modelId, entryId)` — for revision listing

**Schema creation:** Single `CREATE TABLE IF NOT EXISTS` on first access. No dynamic ALTER TABLE, no schema registry, no `cms_table_schemas` metadata table.

**`webiny_cms_groups`** and **`webiny_cms_models`** keep their current fixed schemas with simple CRUD.

#### Entry Mappers

**`entryToRow(entry, model, options: { isLatest, isPublished })`**
- Spread all system/meta fields directly.
- Write `modelId` from `model.modelId` (not from entry — entry may not carry it).
- Write `tenant` from `model.tenant`.
- `JSON.stringify(values)` into the `values` column.
- `JSON.stringify` identity objects, location, meta, system, live.
- Set `isLatest` and `isPublished` from options.

**`rowToEntry(row)`**
- `JSON.parse(values)` back to object.
- `JSON.parse` identity blobs, location, meta, system, live.
- Return typed `CmsStorageEntry`.

No field column iteration, no hash-based column naming, no null-object collapsing.

#### `get` Operation

Works like `list` with `limit=1`. Loads matching rows based on `where.isLatest` / `where.isPublished`, applies in-memory filtering from the `where` clause, optionally sorts, and returns the first match or `null`.

#### List Operation

Three query modes, all followed by in-memory filtering:

1. **Latest entries:** `SELECT * FROM entries WHERE tenant=? AND modelId=? AND isLatest=true`
2. **Published entries:** `SELECT * FROM entries WHERE tenant=? AND modelId=? AND isPublished=true`
3. **Entry revisions:** `SELECT * FROM entries WHERE tenant=? AND modelId=? AND entryId=?`

After loading rows:
1. `rowToEntry()` each row.
2. Apply CMS `fromStorage` transforms per field.
3. `filter()` from `@webiny/db-utils` — in-memory expression tree evaluation.
4. `totalCount = filteredItems.length`.
5. `sort()` from `@webiny/db-utils` — in-memory sort.
6. Offset-based pagination: `slice(start, start + limit)`. Cursor is base64-encoded integer offset (same as DDB).
7. Return `{ items, totalCount, hasMoreItems, cursor }`.

#### Write Operations

Same flag-flipping logic as the current SQL implementation. Simplified mappers — entry-level meta propagation uses only the JSON blob columns (e.g. `modifiedBy`, `savedBy`), not the removed `_id`/`_displayName`/`_type` variants. `ENTRY_LEVEL_META_FIELDS` must be updated accordingly.

| Operation | SQL Queries |
|---|---|
| `create` | INSERT with `isLatest=true`, `isPublished` based on status |
| `createRevisionFrom` | UPDATE old latest `isLatest=false`, INSERT new with `isLatest=true` |
| `update` | UPDATE row, propagate entry-level meta to all revisions (`WHERE entryId=?`) |
| `publish` | UPDATE old published `isPublished=false, status="unpublished"`, UPDATE new `isPublished=true`, propagate entry-level meta + live to all revisions |
| `unpublish` | UPDATE `isPublished=false`, propagate `live=null` to all revisions |
| `move` | UPDATE all revisions: location fields |
| `moveToBin` | UPDATE all revisions: `wbyDeleted=true, isPublished=false, live=null`, entry-level meta |
| `restoreFromBin` | UPDATE all revisions: `wbyDeleted=false`, find highest version, set `isLatest=true` |
| `deleteRevision` | DELETE row, handle flag cascading to new latest |
| `delete` | DELETE WHERE entryId |
| `deleteMultipleEntries` | DELETE WHERE entryId IN (...) |

#### `getUniqueFieldValues`

Load all matching entries (latest/published), parse `values` JSON, extract the target field, aggregate in memory. Same approach as DDB.

#### Retained Features

The following existing features are kept (with simplified usage):

- `features/knexInstance/` — KnexInstance abstraction and factory registration
- `features/tableNameResolver/` — TableNameResolver (updated for new table naming: `{prefix}webiny_cms_entries{suffix}` etc.)
- `features/groupSchemaManager/` — fixed `CREATE TABLE IF NOT EXISTS` for groups table
- `features/modelSchemaManager/` — fixed `CREATE TABLE IF NOT EXISTS` for models table
- `operations/group/` — group CRUD (simple SQL, mostly unchanged)
- `operations/model/` — model CRUD (simple SQL, mostly unchanged)

A new `EntryTableManager` (or similar) replaces `EntrySchemaManager` — just `CREATE TABLE IF NOT EXISTS` with the fixed column set, no ALTER TABLE or schema diffing.

#### Deleted Code

The following are removed entirely from the SQL package:

- `whereBuilder.ts` — `applyWhere`, `applySearch`, `applyKeysetCondition`
- `features/sqlOperator/` — all 14 operators + registry
- `features/sqlEntryFilter/` — DefaultFilter, ObjectFilter, RefFilter + registry
- `features/entrySchemaManager/` — dynamic schema, ALTER TABLE, columnBuilder
- `features/schemaRegistry/` — verified-table cache
- `features/fieldTypeMapper/` — CMS field to SQL column mapping
- `utils/columnName.ts` — hash-based column naming
- `utils/parseWhereKey.ts`, `utils/parseSortField.ts`
- `utils/cursor.ts` — keyset cursor (replaced by offset cursor)

---

### 3. Updated: `@webiny/api-headless-cms-ddb`

Mechanical import repointing only — no logic changes:

- Delete `src/operations/entry/filtering/` — import from `@webiny/db-utils/filtering/`
- Delete `src/plugins/` (4 base classes) — import from `@webiny/db-utils/plugins/`
- Delete `src/dynamoDb/path/` and `src/dynamoDb/transformValue/` — import from `@webiny/db-utils/path/` and `@webiny/db-utils/transforms/`
- Update all internal imports across the package

---

### 4. Updated: `@webiny/db-dynamodb`

- Move `ValueFilter` and `ValueFilterRegistry` abstractions to `@webiny/db-utils/valueFilter/`
- Repoint imports within `db-dynamodb` to the new location
- Re-export from `db-dynamodb` if external consumers depend on the current import paths

---

## Invariants

1. **One `isLatest=true` per entryId** — enforced by write operations flipping the old latest before inserting a new one.
2. **Zero or one `isPublished=true` per entryId** — enforced by publish/unpublish flipping flags.
3. **`isPublished=true` always accompanies `status="published"`** — set atomically in the same UPDATE.
4. **Entry-level meta propagated to all revisions** on any write that changes them — same `UPDATE WHERE entryId=?` pattern as current SQL.
5. **`live` field set on all revisions** when publishing, cleared on unpublish/bin/published-revision-delete.

## Test Strategy

Existing CMS test suites in `packages/api-headless-cms/__tests__/` run against the SQL backend via `WEBINY_STORAGE=sql,ddb`. No test changes needed — the storage interface is unchanged, only the internal implementation differs.

SQLite in-memory via `better-sqlite3` remains the test database.
