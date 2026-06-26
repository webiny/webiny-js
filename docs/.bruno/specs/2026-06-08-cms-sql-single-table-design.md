# CMS SQL Single-Table Rewrite

Date: 2026-06-08
Package: `@webiny/api-headless-cms-sql`
Branch: `bruno/feat/api-headless-cms-sql-long-running-db`

## Motivation

The current entry storage maps CMS fields to individual SQL columns (~51 columns per entry row) with complex entryToRow/rowToEntry mappers. None of these columns are ever queried at the SQL level — filtering and sorting happen in-memory after loading rows. The column-per-field design is pure overhead.

The rewrite stores the full entry as a JSON blob in a single `data` column, with a small set of indexed columns for the few SQL-level filters that actually run.

## Record Model

Every row is a revision. `isLatest` and `isPublished` are boolean tags on whichever revision currently holds that role — not separate record types.

| Action | Rows |
|---|---|
| Create entry | Rev 1: `isLatest=true, isPublished=false` |
| Publish rev 1 | Rev 1: `isLatest=true, isPublished=true` |
| Create rev 2 | Rev 1: `isLatest=false, isPublished=true` / Rev 2: `isLatest=true, isPublished=false` |
| Publish rev 2 | Rev 1: `isLatest=false, isPublished=false` / Rev 2: `isLatest=true, isPublished=true` |

- Every row is always a revision. The flags add meaning, they don't exclude it from being a revision.
- At most one row per entry has `isLatest = true`. At most one has `isPublished = true`. A single row can have both.
- Contrast with DynamoDB: DDB stores separate L and P records as full copies alongside revision records. The SQL design has exactly one row per revision, with boolean flags instead of record duplication.

## Schema

One table: `webiny_cms_entries`.

```sql
CREATE TABLE webiny_cms_entries (
    id           TEXT PRIMARY KEY,
    entryId      TEXT NOT NULL,
    modelId      TEXT NOT NULL,
    tenant       TEXT NOT NULL,
    version      INTEGER NOT NULL,
    isLatest     BOOLEAN NOT NULL DEFAULT FALSE,
    isPublished  BOOLEAN NOT NULL DEFAULT FALSE,
    wbyDeleted   BOOLEAN NOT NULL DEFAULT FALSE,
    data         TEXT NOT NULL
);

CREATE INDEX idx_latest    ON webiny_cms_entries (tenant, modelId, isLatest);
CREATE INDEX idx_published ON webiny_cms_entries (tenant, modelId, isPublished);
CREATE INDEX idx_entry     ON webiny_cms_entries (tenant, modelId, entryId);
```

9 columns. Static. Never altered. No schema registry, no field type mapper.

Groups and models keep their existing separate tables — they are already simple and untouched by this rewrite.

## IEntryRow

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

## Mappers

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

Neither mapper takes a `model` parameter. The current implementation needs the model to reconstruct `values` from individual columns — the new design does not. The `fromStorage` transforms that need the model (decompressing long-text, rich-text, etc.) are called separately in the operations after `rowToEntry` returns.

The indexed columns are duplicated between the row and the `data` blob. Intentional — they exist in the row for SQL WHERE clauses, and in the blob because it is the full entry.

## Entry-Level Meta Sync

When a revision is updated/published/unpublished, entry-level date and identity fields must sync to all sibling revisions. A helper function handles this:

```ts
const IMMUTABLE_FIELDS = new Set(["createdOn", "createdBy"]);

const mergeEntryLevelMeta = (
    source: CmsEntry,
    target: CmsEntry
): CmsEntry => {
    const result = structuredClone(target);
    for (const field of Object.keys(source)) {
        if (IMMUTABLE_FIELDS.has(field)) {
            continue;
        }
        if ((field.endsWith("On") || field.endsWith("By")) && !field.startsWith("revision")) {
            result[field] = source[field];
        }
    }
    return result;
};
```

- `source`: the entry that was just updated.
- `target`: a sibling revision.
- Entry-level fields (`modifiedOn`, `savedBy`, `firstPublishedOn`, etc.) come from source.
- `createdOn` and `createdBy` are immutable — they identify who originally created the entry and are never overwritten on siblings.
- Revision-level fields (`revisionCreatedOn`, `revisionModifiedBy`, etc.) are excluded by the `!field.startsWith("revision")` check.
- Everything else in the sibling (`values`, `status`, `location`, `meta`, `system`, etc.) stays untouched.
- `structuredClone` prevents accidental mutation of the target.

**Sync scope**: all sibling revisions, not just the latest. This is a change from the current code (which only syncs to latest). Every revision of the entry gets the updated meta fields.

**`live` field**: `mergeEntryLevelMeta` does not handle `live` — it doesn't end in "On" or "By". The `live` field is patched explicitly in the operations that need it (`publish`, `unpublish`, `deleteRevision`), not through the meta sync helper.

Usage in operations — load all siblings, patch in JS, write back in a single `CASE/WHEN` UPDATE:

```ts
const siblings = await query()
    .where("entryId", entry.entryId)
    .whereNot("id", entry.id);

if (siblings.length === 0) {
    return;
}

const cases = siblings.map((row) => {
    const merged = mergeEntryLevelMeta(entry, JSON.parse(row.data));
    return { id: row.id, data: JSON.stringify(merged) };
});

await query()
    .where("entryId", entry.entryId)
    .whereNot("id", entry.id)
    .update({
        data: knex.raw(
            `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
            cases.flatMap((c) => [c.id, c.data])
        )
    });
```

One read + one write instead of N individual updates. Works in both SQLite and PostgreSQL.

## Operations

All 22 operations keep their existing query logic. The key difference: fields that were previously separate columns (`status`, `locked`, `live`, `location`, `binOriginalFolderId`, etc.) now live only inside the `data` blob. Any write that changes these fields must load-patch-save the `data` blob, not update a flat column.

### Reads

| Operation | Query |
|---|---|
| `list` / `get` | `WHERE (tenant, modelId, isLatest\|isPublished)` + optional `wbyDeleted`, `entryId`. Parse `data`. In-memory filter/sort. |
| `getRevisions` | `WHERE entryId = ? ORDER BY version DESC`. Every row is a revision. |
| `getByIds` | `WHERE id IN (...)`. Parse `data`. |
| `getPublishedByIds` | `WHERE entryId IN (...) AND isPublished = true`. Parse `data`. |
| `getLatestByIds` | `WHERE entryId IN (...) AND isLatest = true`. Parse `data`. |
| `getRevisionById` | `WHERE id = ?`. Parse `data`. |
| `getLatestRevisionByEntryId` | `WHERE entryId = ? AND isLatest = true`. Parse `data`. |
| `getPublishedRevisionByEntryId` | `WHERE entryId = ? AND isPublished = true`. Parse `data`. |
| `getPreviousRevision` | `WHERE entryId = ? AND version < ? ORDER BY version DESC LIMIT 1`. Parse `data`. |
| `getUniqueFieldValues` | `WHERE (tenant, modelId, isLatest)`. Parse `data`. Extract values in-memory. |

### Writes

| Operation | Logic |
|---|---|
| `create` | `INSERT` row. |
| `createRevisionFrom` | Set `isLatest = false` + patch `data` on old latest. If new revision is published, set `isPublished = false` + patch `data` (status) on old published. `INSERT` new row. |
| `update` | `UPDATE WHERE id = ?`. Sync entry-level meta to siblings via load-patch-save. |
| `publish` | Set `isPublished = false` + patch `data` (status, live) on old published. `UPDATE` target with `isPublished = true` + patched `data` (status, live). Sync entry-level meta to siblings. |
| `unpublish` | Set `isPublished = false` + patch `data` (status, live=null) on target. Sync entry-level meta to siblings. |
| `move` | Load-patch-save `data` on all revisions (location change). No indexed columns affected. |
| `moveToBin` | Set `wbyDeleted = true`. Load-patch-save `data` on all revisions (wbyDeleted, binOriginalFolderId). |
| `restoreFromBin` | Set `wbyDeleted = false`. Load-patch-save `data` on all revisions (wbyDeleted, binOriginalFolderId=null, location). |
| `deleteRevision` | `DELETE WHERE id = ?`. If was published, load-patch-save `data` (live=null) on remaining revisions. If was latest, promote another revision (`isLatest = true`). |
| `delete` | `DELETE WHERE entryId = ?`. |
| `deleteMultipleEntries` | `DELETE WHERE entryId IN (...)`. |

## Code Changes

The features that supported column-per-field mapping (`entrySchemaManager`, `fieldTypeMapper`, `schemaRegistry`, `sqlOperator`, `sqlEntryFilter`, and the `utils/` directory) were already deleted in an earlier refactor. No files need to be deleted in this rewrite.

What changes:

| Path | Change |
|---|---|
| `features/entryTableManager/EntryTableManager.ts` | Rewrite DDL to create the 9-column static table. Keep `reset()` method for test cleanup. |
| `operations/entry/index.ts` | Rewrite all 22 operations to use the new row format. Load-patch-save where flat column updates used to be. |
| `operations/entry/mappers.ts` | Replace with `entryToRow`, `rowToEntry`, `mergeEntryLevelMeta`. |
| `operations/entry/types.ts` | Replace with 9-field `IEntryRow`. |
| `index.ts` | Update DI registration if needed. |

What stays untouched:

| Path | Reason |
|---|---|
| `features/knexInstance/` | Knex connection. |
| `features/tableNameResolver/` | Tenant-scoped table names. |
| `features/groupSchemaManager/` | Groups table unchanged. |
| `features/modelSchemaManager/` | Models table unchanged. |
| `operations/group/` | Untouched. |
| `operations/model/` | Untouched. |

## Test Setup

`setupFile.js` and `setupAfterEnv.js` stay the same pattern — create Knex instance, drop all tables before each test, destroy after all. `EntryTableManager` still needs its `initialized` flag reset between tests (via `globalThis.__sqlTableManagers` and `reset()`), otherwise it won't recreate the dropped table. This mechanism stays — it just has fewer managers to track.

## Not In Scope

- PostgreSQL persistent test database (separate concern).
- Groups/models table changes (already simple).
- Migration from old schema (no production data).
- SQL-level field filtering (will never exist in this storage layer).
