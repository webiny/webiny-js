# Single-Table Design for api-headless-cms-sql

Date: 2026-06-08

## Motivation

The current implementation maps CMS entry fields to individual SQL columns. This requires EntrySchemaManager, FieldTypeMapper, ALTER TABLE for new fields, hash-based column names for deeply nested fields, and complex entryToRow/rowToEntry mappers — all for columns that are never queried at the SQL level. Filtering and sorting already happen in-memory after loading rows. The column-per-field design is pure overhead.

The new design stores the full entry as a JSON blob in a single `data` column, with a small set of indexed columns for the few SQL-level filters that actually run.

## Schema

One table: `webiny_cms_entries`.

```sql
CREATE TABLE webiny_cms_entries (
    id           TEXT PRIMARY KEY,   -- revision ID (e.g., "abc123#0003")
    entryId      TEXT NOT NULL,      -- shared across all revisions
    modelId      TEXT NOT NULL,
    tenant       TEXT NOT NULL,
    version      INTEGER NOT NULL,
    isLatest     BOOLEAN NOT NULL DEFAULT FALSE,
    isPublished  BOOLEAN NOT NULL DEFAULT FALSE,
    wbyDeleted   BOOLEAN NOT NULL DEFAULT FALSE,
    data         TEXT NOT NULL       -- JSON.stringify(entry)
);

CREATE INDEX idx_latest    ON webiny_cms_entries (tenant, modelId, isLatest);
CREATE INDEX idx_published ON webiny_cms_entries (tenant, modelId, isPublished);
CREATE INDEX idx_entry     ON webiny_cms_entries (tenant, modelId, entryId);
```

That is the entire schema. No ALTER TABLE, no schema registry, no field type mapper.

Groups and models keep their own simple tables (they are already simple enough and rarely change).

## Mapper

```ts
const entryToRow = (entry: CmsEntry): IEntryRow => ({
    id: entry.id,
    entryId: entry.entryId,
    modelId: entry.modelId,
    tenant: entry.tenant,
    version: entry.version,
    isLatest: entry.isLatest,
    isPublished: entry.isPublished,
    wbyDeleted: entry.wbyDeleted,
    data: JSON.stringify(entry)
});

const rowToEntry = (row: IEntryRow): CmsEntry => {
    return JSON.parse(row.data);
};
```

No field-by-field mapping. No identity parsing. No null-object collapse. No getEntryLevelMeta extraction. The `data` blob IS the entry.

## IEntryRow Interface

```ts
interface IEntryRow {
    id: string;
    entryId: string;
    modelId: string;
    tenant: string;
    version: number;
    isLatest: boolean;
    isPublished: boolean;
    wbyDeleted: boolean;
    data: string;
}
```

## What the 22 Operations Look Like

All operations use the same SQL-level filters they use today. The only columns referenced in WHERE clauses are the indexed ones above. Nothing changes in query shape — only the row format changes.

### Read Operations

**list / get**: Query by `(tenant, modelId, isLatest|isPublished)` + optional `wbyDeleted` and `entryId`. Load rows, `JSON.parse(row.data)` each one, then apply in-memory filters and sorting. Same as today.

**getByIds / getPublishedByIds / getLatestByIds**: Query by `id IN (...)` or `entryId IN (...)` + `isPublished = true`. Parse data. Same as today.

**getRevisions**: Query by `(tenant, modelId, entryId)` ordered by `version DESC`. Parse data. Same as today.

**getRevisionById / getPublishedRevisionByEntryId / getLatestRevisionByEntryId / getPreviousRevision**: Single-row lookups by indexed columns. Parse data.

**getUniqueFieldValues**: Load rows matching `(tenant, modelId, isLatest)`, parse data, extract unique values in-memory. Same as today.

### Write Operations

**create**: `entryToRow(entry)` then `INSERT`.

**createRevisionFrom**: Update old latest (`isLatest = false`), optionally unpublish old published, then `INSERT` new row.

**update**: `entryToRow(entry)` then `UPDATE WHERE id = ?`. For entry-level meta sync, update `data` on sibling revisions — see section below.

**publish**: Set `isPublished = false` on currently published revision, then `UPDATE` target row with `isPublished = true`. Sync entry-level meta.

**unpublish**: Set `isPublished = false` on target. Sync entry-level meta.

**move / moveToBin / restoreFromBin**: Update indexed columns (`wbyDeleted`, etc.) + update `data` blob on all revisions of the entry.

**deleteRevision**: `DELETE WHERE id = ?`. If was latest, update another revision's `isLatest = true`.

**delete / deleteMultipleEntries**: `DELETE WHERE entryId = ?` or `DELETE WHERE entryId IN (...)`.

### Entry-Level Meta Sync

Some fields (modifiedOn, savedOn, deletedOn, firstPublishedOn, lastPublishedOn, and their `*By` identity counterparts) must be synced across ALL revisions of an entry when any revision is updated.

**Current approach**: Extracts 12 fields from the row and runs `UPDATE SET field1=?, field2=?, ... WHERE entryId = ?`.

**New approach**: The sync must update the `data` JSON blob on sibling revisions. Two options:

**Option A — Load, patch, save (simple, recommended):**
```ts
const siblings = await query()
    .where("entryId", entry.entryId)
    .whereNot("id", entry.id);

for (const row of siblings) {
    const sibling = JSON.parse(row.data);
    sibling.modifiedOn = entry.modifiedOn;
    sibling.savedOn = entry.savedOn;
    /* ...patch all 12 entry-level meta fields... */
    await query()
        .where("id", row.id)
        .update({ data: JSON.stringify(sibling) });
}
```

This is slightly more work than a flat column UPDATE, but the number of revisions per entry is small (typically < 20). The simplicity of having no column mapping is worth this tradeoff.

**Option B — SQL JSON functions (PostgreSQL only):**
```sql
UPDATE webiny_cms_entries
SET data = jsonb_set(data::jsonb, '{modifiedOn}', '"2026-06-08T..."')
WHERE entryId = ? AND id != ?
```

This is faster but ties you to PostgreSQL. Not recommended since we want SQLite compatibility for tests.

## What Gets Deleted

These features/files become unnecessary:

| Feature/File | Why |
|---|---|
| `features/entrySchemaManager/` | No dynamic schema — table is static |
| `features/fieldTypeMapper/` | No CMS-field-to-SQL-column mapping |
| `features/schemaRegistry/` | No schema caching needed |
| `utils/columnName.ts` | No column name computation |
| `utils/parseSortField.ts` | Sorting is fully in-memory via db-utils |
| `utils/parseWhereKey.ts` | No SQL-level field filtering |
| `features/sqlOperator/` | No SQL WHERE operators per field |
| `features/sqlEntryFilter/` | No SQL entry filtering dispatch |
| `operations/entry/types.ts` (current) | Replaced with 9-field IEntryRow |
| `operations/entry/mappers.ts` (current) | Replaced with JSON.stringify/parse |

## What Stays

| Feature/File | Why |
|---|---|
| `features/knexInstance/` | Still need the Knex connection |
| `features/tableNameResolver/` | Still resolve table names with tenant prefix |
| `features/entryTableManager/` | Simplified — creates one static table |
| `features/groupSchemaManager/` | Groups table unchanged |
| `features/modelSchemaManager/` | Models table unchanged |
| `operations/entry/index.ts` | All 22 operations — query logic stays, mapper changes |
| `operations/group/` | Unchanged |
| `operations/model/` | Unchanged |
| In-memory filtering (db-utils) | Still used for CMS field filtering + sorting |

## Test Setup Changes

**setupAfterEnv.js**: Same — drop all tables before each test, reset managers.

**setupFile.js**: Same — create Knex instance, register storage operations. No schema managers to configure per model.

The static schema means table creation is a one-time `CREATE TABLE IF NOT EXISTS` instead of a lazy per-model ALTER TABLE chain.

## Migration Path

This is a rewrite of the entry storage layer only. Groups and models are untouched.

1. Replace `IEntryRow` with the 9-field version.
2. Replace `entryToRow` / `rowToEntry` with JSON.stringify / JSON.parse.
3. Replace `EntryTableManager.ensureTable()` with a static `CREATE TABLE IF NOT EXISTS`.
4. Update all 22 operations to use the new row shape.
5. Delete EntrySchemaManager, FieldTypeMapper, SchemaRegistry, SQL operators, SQL filters, column utils.
6. Run all 878 tests. The query shapes are identical — only the row format changes.

## Comparison

| | Current (column-per-field) | New (single data blob) |
|---|---|---|
| Entry columns | ~51 + dynamic per model field | 9 (fixed) |
| Schema changes on model update | ALTER TABLE ADD COLUMN | None |
| entryToRow complexity | Field-by-field mapping, identity serialization, null handling | JSON.stringify |
| rowToEntry complexity | Field-by-field parsing, identity defaults, null-object collapse | JSON.parse |
| SQL-level field filtering | Never used (in-memory) | N/A |
| Code to delete | — | ~10 features/utils |
| Entry-level meta sync | UPDATE 12 flat columns | Load + patch + save siblings |
| Future PostgreSQL JSON queries | Possible with column data | Possible with jsonb cast |
