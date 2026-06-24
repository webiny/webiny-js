# SQL Storage for Webiny Headless CMS

Date: 2026-06-01
Package: `@webiny/api-headless-cms-sql`
Branch: `bruno/feat/api-headless-cms-sql`

---

## Why SQL

Webiny's current storage backend splits work across two systems:

- **DynamoDB** — stores entry data as JSON items. Schemaless, fast single-item operations, 400KB item size limit.
- **OpenSearch** — indexes entry data for search, filtering, and aggregation. Maintains a separate copy of every entry.

This split means two data stores to manage, sync, and pay for. OpenSearch adds operational complexity (cluster sizing, index limits — hard cap of 1000 indexes across all tenants and models), and the two-store sync introduces eventual consistency.

**SQL replaces both as a single store.** One database handles storage, filtering, search, sorting, and aggregation. No sync, no eventual consistency, no separate search cluster. The tradeoff is that SQL must handle workloads that were previously offloaded to a purpose-built search engine.

Supported dialects: **PostgreSQL**, **MySQL**, **SQLite** (including possible production use).

---

## How It Works

### The Existing CMS Data Flow

```
User → GraphQL → CMS Use Case → Storage Transforms → Storage Operations → Database
```

The CMS core (`api-headless-cms`) defines 22 `CmsEntryStorageOperations` methods. Each storage backend implements these methods. The CMS doesn't know or care whether the backend is DDB, SQL, or something else — it calls the same interface.

Storage transforms run *before* values reach the storage layer. They're part of the CMS core, not the storage backend. This is important because some transforms (gzip compression) are designed for DDB's constraints and break SQL queries.

### What SQL Changes

Only the storage operations layer is replaced. Everything above it — GraphQL, use cases, validation, transforms, permissions — stays the same. The SQL package plugs into the same `CmsEntryStorageOperations` interface.

```
                          ┌─────────────────────┐
                          │     GraphQL API      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │    CMS Use Cases      │
                          │  (create, publish,    │
                          │   list, delete, ...)  │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Storage Transforms   │
                          │  (compress, encrypt,  │
                          │   date format, ...)   │
                          └──────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼──────────┐ ┌────────▼─────────┐ ┌─────────▼─────────┐
   │  api-headless-cms-   │ │ api-headless-cms-│ │ api-headless-cms- │
   │  ddb (DynamoDB)      │ │ ddb-es (DDB+OS)  │ │ sql (SQL)         │
   └──────────────────────┘ └──────────────────┘ └───────────────────┘
```

### DDB+OS vs SQL: Fundamental Differences

| Concern | DDB + OpenSearch | SQL |
|---|---|---|
| Storage | DDB items (schemaless JSON) | Table-per-model with typed columns |
| Search/filter | OpenSearch inverted index | SQL WHERE clauses, LIKE, indexes |
| Full-text search | OpenSearch multi_match | `LIKE '%term%'` (v1, no FTS index) |
| Schema | None (DDB) / dynamic mapping (OS) | Explicit — CREATE TABLE, ALTER TABLE ADD COLUMN |
| Data copies | Two (DDB + OS) | One |
| Compression | Yes — fits DDB's 400KB limit | No — SQL has no item size limit |
| Entry structure | 3 records per revision (L, P, REV) | 1 row per revision with boolean flags |
| Transactions | Limited (DDB transactions expensive) | Full ACID transactions |
| TTL | Native DDB TTL auto-deletes | Application-level cleanup required |
| Index limits | OpenSearch: 1000 indexes | No practical table limit |

---

## Architecture

### Table-per-Model

Each CMS model gets its own SQL table. A model called "Article" with fields `title` (text) and `body` (long-text) produces a table like:

```sql
CREATE TABLE cms_t1_article (
    -- Meta columns (same on every table)
    id          TEXT PRIMARY KEY,
    entryId     TEXT,          -- shared across revisions
    version     INTEGER,
    status      TEXT,          -- 'draft', 'published', 'unpublished'
    isLatest    BOOLEAN,       -- latest revision flag
    isPublished BOOLEAN,       -- published revision flag
    tenant      TEXT,          -- tenant ID (shared tables only)
    wbyDeleted  BOOLEAN,       -- soft-delete (bin) flag
    live_version INTEGER,      -- version of published revision (null if none)
    ...                        -- identity fields, timestamps, location, etc.

    -- Field columns (derived from model definition)
    "text@title"      TEXT,
    "long-text@body"  TEXT
);
```

Column names come from the field's `storageId` (format: `type@fieldId`). The `storageId` is immutable — renaming a field in the UI changes `fieldId` but not `storageId`, so no column migration is needed.

### One Row per Revision

DDB stores 3 records per revision: a Latest record (L), a Published record (P), and a Revision record (REV). SQL stores **one row** per revision with boolean flags:

| id | entryId | version | isLatest | isPublished | status |
|---|---|---|---|---|---|
| abc#0001 | abc | 1 | false | false | unpublished |
| abc#0002 | abc | 2 | false | true | published |
| abc#0003 | abc | 3 | true | false | draft |

Publishing revision 3 means: set revision 2's `isPublished = false`, set revision 3's `isPublished = true`, and update `live_version` on all rows.

### Nested Field Flattening

Object fields are decomposed into child columns. Dynamic zones flatten all template fields into the same table. Only the leaf fields get columns — parent objects do not.

```
Model: Article
  title: text
  address: object
    city: text
    zip: number
  content: dynamicZone
    hero template:
      heading: text
    gallery template:
      caption: text
```

Produces columns:
- `text@title`
- `object@address__text@city`
- `object@address__number@zip`
- `dynamicZone@content__text@heading`
- `dynamicZone@content__text@caption`

An entry using the `hero` template has `caption` as NULL. This creates sparse rows — acceptable, NULLs are cheap.

For 2+ levels of nesting, intermediate segments are hashed: `parent__{sha256_8chars}__leaf`.

List-of-objects are NOT decomposed — stored as a single JSON column.

### Reference Fields

Each ref field creates two columns:

| Column | Content | Purpose |
|---|---|---|
| `ref@author` | Full ref JSON: `{"entryId":"abc#001","id":"abc"}` | Data storage |
| `ref@author__entryId` | Extracted ID: `"abc"` | Filtering without JSON parsing |

### Multi-Tenancy

Two modes:

- **Dedicated tables** (default): each tenant gets its own table set. Table name includes tenant ID: `cms_{tenant}_{model}`.
- **Shared tables** (`WEBINY_SHARED_TABLES=true`): all tenants share one table set. A `tenant` column (indexed) + `WHERE tenant = ?` on every query provides isolation.

### Entry Operations (22 Methods)

The `CmsEntryStorageOperations` interface defines 22 methods, all implemented:

**Read (8):** `getByIds`, `getPublishedByIds`, `getLatestByIds`, `getRevisions`, `getRevisionById`, `getPublishedRevisionByEntryId`, `getLatestRevisionByEntryId`, `getPreviousRevision`

**Get + List (2):** `get` (single entry by filter), `list` (paginated with filtering, sorting, search)

**Write (3):** `create`, `createRevisionFrom`, `update`

**Lifecycle (7):** `publish`, `unpublish`, `move`, `moveToBin`, `restoreFromBin`, `deleteRevision`, `delete`, `deleteMultipleEntries`

**Aggregate (1):** `getUniqueFieldValues`

### Pagination

Keyset pagination with base64-encoded cursors. The cursor encodes the sort field values of the last item + the `id` as a tiebreaker:

```
cursor = base64({ "text@title": "Article Z", "id": "abc#0003" })
```

Next page: `WHERE (title > 'Article Z') OR (title = 'Article Z' AND id > 'abc#0003')`.

No offset-based pagination — keyset is consistent under concurrent inserts/deletes.

---

## DI Architecture

The SQL package uses Webiny's DI framework (`createAbstraction`, `createImplementation`, `createFeature`).

```
registerSqlStorageOperations(config)
  → createFeature("cms.storageOperations.sql")
    ├── KnexInstanceFeature        — Knex connection wrapper
    ├── TableNameResolverFeature   — tenant-scoped table naming
    ├── SchemaRegistryFeature      — in-memory cache of verified tables
    ├── FieldTypeMapperFeature     — CMS field type → SQL column type
    ├── GroupSchemaManagerFeature   — group table DDL
    ├── ModelSchemaManagerFeature   — model table DDL
    ├── EntrySchemaManagerFeature   — entry table DDL (dynamic per model)
    ├── SqlOperatorFeature         — 14 WHERE operators (eq, not, in, contains, gt, ...)
    ├── SqlEntryFilterFeature      — 3 field-type filters (default, object, ref)
    └── StorageOperationsFactory   — creates the 22-method implementation
```

### Package Structure

```
packages/api-headless-cms-sql/src/
├── index.ts                        # registerSqlStorageOperations() — main entry
├── types.ts                        # factory types
├── features/
│   ├── knexInstance/                # Knex connection abstraction
│   ├── tableNameResolver/          # tenant → table name mapping
│   ├── fieldTypeMapper/            # CMS type → SQL type
│   ├── schemaRegistry/             # verified table cache + version invalidation
│   ├── groupSchemaManager/         # group table CREATE/ALTER
│   ├── modelSchemaManager/         # model table CREATE/ALTER
│   ├── entrySchemaManager/         # entry table CREATE/ALTER (per-model, dynamic columns)
│   ├── sqlOperator/                # 14 SQL WHERE operators
│   │   ├── abstractions/           #   ISqlOperator, ISqlOperatorRegistry
│   │   ├── operators/              #   Eq, Not, In, Contains, Gt, Lt, Between, StartsWith, ...
│   │   └── feature.ts
│   └── sqlEntryFilter/             # field-type-specific filter dispatch
│       ├── abstractions/           #   ISqlEntryFilter, ISqlEntryFilterRegistry
│       ├── fields/                 #   DefaultFilter, ObjectFilter, RefFilter
│       └── feature.ts
├── operations/
│   ├── group/                      # group CRUD + mappers
│   ├── model/                      # model CRUD + mappers
│   └── entry/                      # 22 entry methods + mappers + whereBuilder
│       ├── index.ts                #   all entry storage operations
│       ├── types.ts                #   IEntryRow, meta column definitions
│       ├── mappers.ts              #   entryToRow / rowToEntry
│       └── whereBuilder.ts         #   CmsEntryListWhere → Knex WHERE clauses
└── utils/
    ├── parseSortField.ts           # sort string → { field, direction }
    ├── parseWhereKey.ts            # "field_not_in" → { fieldId, operator }
    ├── columnName.ts               # storageId path → SQL column name
    └── cursor.ts                   # keyset cursor encode/decode
```

---

## Write Path (Entry Creation)

```
1. CMS Use Case calls storageOperations.entries.create(model, { entry, storageEntry })
       │
       │  storageEntry has already been through storage transforms
       │  (long-text compressed, dates formatted, objects recursed, etc.)
       │
2. SQL: resolveTable(model)
       │  → Ensures table exists with correct columns (startup/model CRUD already did this)
       │  → SchemaRegistry makes this a no-op after first verification
       │
3. SQL: entryToRow(storageEntry, fieldColumns, { isLatest: true, isPublished: false })
       │  → Flattens entry into flat row: meta fields + identity splits + field values
       │  → Objects/arrays → JSON.stringify()
       │  → Ref fields → extract companion __entryId column
       │
4. SQL: knex(tableName).insert(row)
       │
5. Return entry
```

## Read Path (Entry List)

```
1. CMS Use Case calls storageOperations.entries.list(model, { where, sort, limit, after, search })
       │
2. SQL: resolveTable(model) — verify table exists
       │
3. SQL: Build COUNT(*) query
       │  → applyWhere(where) — translate CMS where to Knex conditions
       │  → applySearch(search, fields) — LIKE '%term%' across searchable fields
       │
4. SQL: Build data query
       │  → Same WHERE as count
       │  → ORDER BY sort fields + id tiebreaker
       │  → Apply keyset condition from cursor (if paginating)
       │  → LIMIT
       │
5. SQL: Execute both queries
       │
6. SQL: For each row → rowToEntry(row, model, fieldColumns)
       │  → Reconstruct nested objects from flat columns
       │  → JSON.parse() for object/array columns
       │  → Parse identity fields from JSON
       │  → Null object collapse
       │
7. SQL: model.convertValueKeyFromStorage(entry)
       │  → Convert storageId keys back to fieldId keys
       │
8. SQL: Encode cursor from last row's sort values
       │
9. Return { items, meta: { cursor, totalCount, hasMoreItems } }
```

---

## Schema Lifecycle

### When Schemas Change

1. **Application startup** — all model definitions (UI + plugin-registered) are collected. Missing tables are created, missing columns are added via ALTER TABLE. This runs once in a single process.
2. **Model CRUD** — user adds/removes/modifies a field in the admin UI. The handling request runs ALTER TABLE immediately.
3. **Never during entry operations** — entry reads/writes assume the table is correct.

### What Never Happens

- Columns are never dropped (dead columns accumulate — cleanup tool later)
- Tables are never dropped (deleted models leave orphaned tables)
- Column types are never changed (new field type = new storageId = new column)
- Columns are never renamed (storageId is immutable)

### Schema Registry

In-memory `Set<string>` of verified table names. Once a table is verified at startup, the check is skipped for all subsequent operations in that process. Version-based invalidation via `globalThis.__schemaRegistryVersion` for tests.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Single store (no search sidecar) | Eliminates DDB+OS sync complexity; SQL handles both storage and queries |
| Table-per-model | Each model has different fields; separate tables enable typed columns |
| Real columns (not JSONB) | Native SQL filtering, sorting, and future indexing on field values |
| JSONB for list fields only | Array element queries need JSON operators; scalar fields stay as real columns |
| Never drop columns or tables | Data preservation; cleanup is a separate tool |
| No foreign keys | Refs are stored IDs; CMS handles integrity (same as DDB) |
| Bypass compression transforms | SQL needs plain text for LIKE; DDB compressed for 400KB limit |
| Keyset pagination (not offset) | Consistent under concurrent mutations; no "skip N" performance cliff |
| Transactions for multi-step ops | No reconciliation sidecar; atomicity must be guaranteed |
| `live_version` integer column | Normalized from JSON; simpler, indexable |
| `time` as numeric seconds | Cross-dialect numeric comparison; no TIME type inconsistencies |
| Startup schema sync | Eliminates concurrent ALTER TABLE races in multi-instance deployments |
| `storageId` as column name | Immutable, encodes type — renames and type changes don't affect columns |

---

## Documents

| Document | Description |
|---|---|
| [Pain Points](./pain-points.md) | All known limitations and scaling cliffs — the summary table |
| [Dialect Differences](./dialect-differences.md) | PostgreSQL vs MySQL vs SQLite — JSONB, NULL sort, Unicode, booleans, FTS, ALTER TABLE |
| [Schema Management](./schema-management.md) | Table lifecycle, ALTER TABLE, startup sync, dead columns, column naming |
| [Query Performance](./query-performance.md) | Full-text search, LOWER() indexing, field indexes, COUNT, N+1 queries |
| [Data Handling](./data-handling.md) | Storage transforms, date/time, keyset pagination NULL bug, TTL |
| [Transactions](./transactions.md) | Which operations need transactions, MVCC, SQLite locking, race conditions |
| [Field-to-Column Mapping](./field-to-column-mapping.md) | How every CMS field type maps to SQL columns |

## Non-Issues (Resolved by Design)

These concerns were evaluated during the design phase and found to be non-problems:

- **Field renames** — `storageId` is immutable; renaming `fieldId` doesn't affect columns.
- **Field type changes** — new type = new `storageId` = new column.
- **Concurrent ALTER TABLE** — schema changes at startup + model CRUD only.
- **Cross-model queries** — none exist in the CMS; every query is single-model scoped.
- **Table count limits** — no practical limit in any dialect (unlike OpenSearch's 1000 index limit).
- **Dynamic zone column sparsity** — wide sparse tables are acceptable; NULLs are cheap.
- **Empty array vs null** — no semantic distinction in the CMS; null in, null out.
- **Relevance-ranked search** — not needed; users always provide explicit sort fields.
- **Referential integrity** — no FK constraints; same approach as DDB.
- **Entry-level meta sync** — single `UPDATE ... WHERE entryId = ?` is a SQL advantage.
- **Data round-trip fidelity** — `entryToRow` → SQL → `rowToEntry` preserves all values correctly.
