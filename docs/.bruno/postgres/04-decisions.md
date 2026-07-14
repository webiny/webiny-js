# Postgres + OpenSearch: Design Decisions

Decisions made during brainstorming. Reference for implementation.

## Architecture

- **Pattern:** Postgres (source of truth) + OpenSearch (search/filter/sort)
- **Deployment:** Server-based (not serverless/Lambda)
- **Sync mechanism:** Postgres WAL Logical Replication -> Node.js worker -> OpenSearch

## Storage

- **Table-per-model:** Each CMS content model = own Postgres table (`webiny_cms_{modelId}`)
- **Shared tables:** Single table per model, tenant column for multi-tenancy (not separate schemas/prefixes)
- **Locale:** Column on same table. Same entry in different locales = different rows
- **Top-level scalar fields:** Real typed columns
- **Nested/object/dynamic-zone fields:** JSONB columns

## Table Structure

Mirrors the `CmsEntry` interface shape. System/meta fields = real columns (indexable for point lookups). User-defined field values = single JSONB `values` column (filtering done by OpenSearch).

```sql
CREATE TABLE webiny_cms_{modelId} (
    -- Identity
    id                          TEXT            PRIMARY KEY,    -- "entryId#version" e.g. "abc123#0003"
    entry_id                    TEXT            NOT NULL,       -- shared across revisions
    model_id                    TEXT            NOT NULL,
    
    -- Tenant / Locale
    tenant                      TEXT            NOT NULL,
    locale                      TEXT            NOT NULL,       -- locale column, same entry diff locales = diff rows
    
    -- Versioning (single row per revision, no separate L/P rows)
    version                     INTEGER         NOT NULL,
    is_latest                   BOOLEAN         NOT NULL DEFAULT false,
    is_published                BOOLEAN         NOT NULL DEFAULT false,
    locked                      BOOLEAN         NOT NULL DEFAULT false,
    status                      TEXT            NOT NULL DEFAULT 'draft',
    
    -- Revision-level timestamps
    revision_created_on         TIMESTAMPTZ     NOT NULL,
    revision_saved_on           TIMESTAMPTZ     NOT NULL,
    revision_modified_on        TIMESTAMPTZ,
    revision_deleted_on         TIMESTAMPTZ,
    revision_restored_on        TIMESTAMPTZ,
    revision_first_published_on TIMESTAMPTZ,
    revision_last_published_on  TIMESTAMPTZ,
    
    -- Revision-level identities (JSONB — { id, displayName, type })
    revision_created_by         JSONB           NOT NULL,
    revision_saved_by           JSONB           NOT NULL,
    revision_modified_by        JSONB,
    revision_deleted_by         JSONB,
    revision_restored_by        JSONB,
    revision_first_published_by JSONB,
    revision_last_published_by  JSONB,
    
    -- Entry-level timestamps
    created_on                  TIMESTAMPTZ     NOT NULL,
    saved_on                    TIMESTAMPTZ     NOT NULL,
    modified_on                 TIMESTAMPTZ,
    deleted_on                  TIMESTAMPTZ,
    restored_on                 TIMESTAMPTZ,
    first_published_on          TIMESTAMPTZ,
    last_published_on           TIMESTAMPTZ,
    
    -- Entry-level identities
    created_by                  JSONB           NOT NULL,
    saved_by                    JSONB           NOT NULL,
    modified_by                 JSONB,
    deleted_by                  JSONB,
    restored_by                 JSONB,
    first_published_by          JSONB,
    last_published_by           JSONB,
    
    -- Location (ACO folder)
    location_folder_id          TEXT,
    bin_original_folder_id      TEXT,
    
    -- Soft delete
    wby_deleted                 BOOLEAN         DEFAULT false,
    
    -- System / Live
    system                      JSONB,
    live                        JSONB,          -- { version: number } | null
    
    -- Misc
    revision_description        TEXT,
    expires_at                  BIGINT,         -- unix timestamp for TTL
    
    -- User-defined field values (ALL model fields stored here as JSONB)
    values                      JSONB           NOT NULL DEFAULT '{}'
);
```

### Timestamp semantics

Two levels of timestamps exist, mirroring the CmsEntry interface:

**Entry-level** (`created_on`, `saved_on`, `modified_on`, etc.):
- `created_on` / `created_by`: Set once when the FIRST revision of the entry is created. Never updated.
- `saved_on` / `saved_by`: Updated on EVERY save of ANY revision.
- `modified_on` / `modified_by`: Updated when entry content changes (not on status-only changes).
- `first_published_on` / `first_published_by`: Set once on first publish of ANY revision. Never updated.
- `last_published_on` / `last_published_by`: Updated on every publish.
- `deleted_on` / `deleted_by`: Set on moveToBin. Cleared on restore.
- `restored_on` / `restored_by`: Set on restoreFromBin.

**Revision-level** (`revision_created_on`, `revision_saved_on`, etc.):
- Same semantics but scoped to the specific revision row.
- `revision_created_on` is when THIS revision was created (not the entry).
- Each revision row tracks its own lifecycle independently.

### Why `model_id` column exists

Table name already encodes modelId (`webiny_cms_{modelId}`), but the column exists for:
- Data integrity verification (cross-check table vs row).
- WAL worker needs modelId from row data (WAL change events include column values but table name extraction from WAL may depend on plugin format).
- Direct SQL admin queries across models (e.g., "find all entries by this user across all models" via UNION).

### Why OpenSearch is required (not optional)

Pure Postgres without OpenSearch was evaluated (see `01-pure-postgres.md`) and rejected for Webiny's requirements. Key reasons:

1. **Dynamic zones are unqueryable at scale in pure SQL.** Dynamic zone content has runtime-determined structure. JSONB containment queries (`@>`) handle equality but not range filters or sorting. Expression indexes require one index per nested path — with dynamic zones, paths are unbounded.

2. **Index explosion.** A model with objects + dynamic zones could need 50+ expression indexes on JSONB paths. At 30M rows, each index = hundreds of MB. Every INSERT/UPDATE maintains all indexes — massive write amplification.

3. **No full-text search comparable to OpenSearch.** Postgres tsvector is functional but lacks relevance scoring, field boosting, synonyms, fuzzy matching, and "did you mean" suggestions that OpenSearch provides natively.

4. **No efficient aggregations.** `getUniqueFieldValues()` in pure PG requires scanning all matching rows. OpenSearch provides native `terms` aggregation.

5. **No CMS in the industry does this.** Survey of 10 CMS systems (see `03-cms-comparison.md`) shows every system at scale either uses a document store or adds a search engine. Drupal requires Solr/ES for production. AEM requires Lucene. Directus degrades at ~100K rows with LIKE-based search.

6. **Nested JSONB array queries are fundamentally unindexable.** This is a mathematical constraint, not a design choice. Concrete example:

   Query: "find entries where any content block of type `stats` has an item with `value > 3000`"

   ```sql
   SELECT * FROM webiny_cms_article
   WHERE EXISTS (
       SELECT 1 FROM jsonb_array_elements(values->'content') block
       WHERE block->>'_templateId' = 'stats'
       AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(block->'items') item
           WHERE (item->>'value')::integer > 3000
       )
   );
   ```

   Postgres can **express** this query. It **cannot execute it efficiently** because:
   - **GIN indexes** only cover containment/equality (`@>`), not range comparisons (`>`, `<`) on nested array elements.
   - **B-tree expression indexes** require a fixed path. Array element positions are variable — you cannot index "the `value` field of every element in every `items` array in every content block."
   - **`jsonb_array_elements`** is a set-returning function that unpacks JSONB arrays row-by-row. At millions of rows, this is CPU-bound, not index-bound.
   - **Sorting** on a nested array field = full scan + in-memory sort. No index can help.

   Approximate performance at scale:

   | Rows | Top-level indexed column | Nested JSONB array filter |
   |------|------------------------|--------------------------|
   | 100K | <10ms | ~200-500ms |
   | 1M | <10ms | ~2-5s |
   | 5M | <10ms | ~10-25s |
   | 30M | <10ms | ~60-120s+ |

   Top-level indexed column = constant time. Nested JSONB array scan = **linear with row count**.

   OpenSearch solves this by flattening all nested fields into an inverted index:
   ```
   content.items.value: [1000, 5000]  → indexed per document
   content._templateId: ["hero", "stats"] → indexed per document
   ```
   Query `content.items.value > 3000` = index lookup. O(log n). Same speed at 30M as at 100K.

### Query routing

**ALL search, filtering, sorting, and listing goes through OpenSearch.** Postgres is never used for list/filter/sort operations.

Postgres is used ONLY for:
- `getRevisionById(id)` — `SELECT * WHERE id = $1`
- `getLatestRevisionByEntryId(entryId)` — `SELECT * WHERE entry_id = $1 AND is_latest = true`
- `getPublishedRevisionByEntryId(entryId)` — `SELECT * WHERE entry_id = $1 AND is_published = true`
- `getRevisions(entryId)` — `SELECT * WHERE entry_id = $1 ORDER BY version`
- `getPreviousRevision(entryId, version)` — `SELECT * WHERE entry_id = $1 AND version < $2 ORDER BY version DESC LIMIT 1`
- Write operations (INSERT/UPDATE/DELETE)

Everything else — `list()`, `get()` with filters, `getUniqueFieldValues()`, full-text search — goes to OpenSearch.

### Why this shape

- **System fields as real columns:** Enables Postgres-level point lookups (get latest, get published, get by entry_id, get revisions). Fast with minimal indexes.
- **`values` as single JSONB:** No PG filtering on user fields — OpenSearch handles all search/filter/sort. No DDL changes when model fields change. No ALTER TABLE on field add/remove/rename.
- **Identity fields as JSONB:** `{ id, displayName, type }` — small objects, never queried in PG.

### Indexes (minimal — PG only for point lookups)

All indexes are created automatically as part of model table setup (`CREATE TABLE` + indexes). No per-field index management needed — adding/removing/changing model fields requires zero index changes in Postgres.

```sql
-- Created once when model table is created:

CREATE INDEX idx_{modelId}_latest
    ON webiny_cms_{modelId} (tenant, locale, entry_id)
    WHERE is_latest = true;

CREATE INDEX idx_{modelId}_published
    ON webiny_cms_{modelId} (tenant, locale, entry_id)
    WHERE is_published = true;

CREATE INDEX idx_{modelId}_revisions
    ON webiny_cms_{modelId} (tenant, locale, entry_id, version);

CREATE INDEX idx_{modelId}_deleted
    ON webiny_cms_{modelId} (tenant, locale, deleted_on DESC)
    WHERE wby_deleted = true;

CREATE INDEX idx_{modelId}_folder
    ON webiny_cms_{modelId} (tenant, locale, location_folder_id)
    WHERE is_latest = true AND wby_deleted = false;
```

### Note on GIN indexes for `values` JSONB column

A GIN index on the `values` column is **not created** because all filtering goes through OpenSearch:

```sql
-- NOT created — would be dead weight since we never query values in PG:
-- CREATE INDEX idx_{modelId}_values_gin ON webiny_cms_{modelId} USING gin (values jsonb_path_ops);
```

If GIN were added, it would cover **equality/containment only** (`@>` operator) on any path inside the JSONB — no per-field setup, works automatically for any field at any depth. But it **cannot** help with range queries (`>`, `<`), sorting, or nested array element filtering (see "Why OpenSearch is required" section above). Since OpenSearch handles all of these, the GIN index would add write overhead with no benefit.

If a future use case requires basic Postgres-level value queries (e.g., admin tools, data export filters), a GIN index can be added per model table without DDL changes to the table itself:

```sql
-- Can be added later if needed, without table lock:
CREATE INDEX CONCURRENTLY idx_{modelId}_values_gin 
    ON webiny_cms_{modelId} USING gin (values jsonb_path_ops);
```

## Versioning

**Simplified vs DDB pattern:**

Current DDB stores 3 separate records per entry: REV# (revision), L (latest pointer), P (published pointer).

Postgres approach: **single row per revision** with boolean columns on that row:

All flag-swap operations use `SELECT FOR UPDATE` + transaction to prevent race conditions:

```sql
-- Publishing version 3 (with row locking for concurrent safety)
BEGIN;
SELECT id FROM webiny_cms_{modelId}
WHERE entry_id = 'abc123' AND (is_published = true OR id = 'abc123#0003')
FOR UPDATE;

UPDATE webiny_cms_{modelId}
SET is_published = (id = 'abc123#0003')
WHERE entry_id = 'abc123' AND (is_published = true OR id = 'abc123#0003');
COMMIT;

-- Creating new revision (with row locking)
BEGIN;
SELECT id FROM webiny_cms_{modelId}
WHERE entry_id = 'abc123' AND is_latest = true
FOR UPDATE;

UPDATE webiny_cms_{modelId}
SET is_latest = false
WHERE entry_id = 'abc123' AND is_latest = true;

INSERT INTO webiny_cms_{modelId} (id, entry_id, version, is_latest, ...)
VALUES ('abc123#0004', 'abc123', 4, true, ...);
COMMIT;
```

Advantages over DDB pattern:
- Fewer rows (1 per revision vs 3 per entry state)
- Atomic updates via transactions (Postgres guarantees consistency)
- Simpler queries: `WHERE entry_id = $1 AND is_latest = true`

## OpenSearch

- **Query building:** Reuse existing `api-opensearch` package (filtering, sorting, body building already extracted)
- **Index per model:** `{tenant}-headless-cms-{modelId}` (with versioned naming on schema changes)
- **Sync:** WAL logical replication, not direct application-level write

## Infrastructure

- **Package name:** `@webiny/api-headless-cms-pg-os`
- **SQL layer:** Reuse `api-core-sql` Knex stack (KnexClient DI abstraction, TableManager, table prefix helpers)
- **Testing:** In-memory Postgres lib (pglite/pg-mem) + real OpenSearch in Docker for integration tests

## Decided: WAL Worker Reliability

From doc 02, these are decided, not open:

- **Idempotency:** OpenSearch indexing is idempotent (PUT with same `_id` overwrites). Worker commits replication slot position only after successful OpenSearch bulk write.
- **Lag monitoring:** Monitor via `pg_stat_replication`. Alert if lag exceeds threshold.
- **Reconnection:** Exponential backoff retry on connection loss. Slot preserves position.
- **Slot validity:** On startup, call `pg_replication_slot_advance()` or attempt to start replication — Postgres returns error `ERROR: requested WAL segment has already been removed` if slot is invalid. Worker detects this, logs a warning, drops the invalid slot, triggers full re-index (background task), creates new slot after re-index completes, then resumes normal WAL consumption.

## Decided: OpenSearch Index Versioning

- Use versioned index names with aliases: `{tenant}-headless-cms-{modelId}-v{schemaVersion}`
- Alias `{tenant}-headless-cms-{modelId}` points to current version.
- On schema change (field type change): create new index, bulk re-index from Postgres, swap alias.
- New fields: OpenSearch dynamic mapping handles automatically (with strict index templates to prevent type conflicts).

## Decided: Transformation Pipeline

WAL worker receives raw row data. Must transform to index-ready format:

1. Determine model from table name (`webiny_cms_{modelId}` -> extract modelId).
2. Load model definition from Postgres models table (cache in worker memory, invalidate on model change events via WAL — model tables are also replicated).
3. Map system columns directly to OpenSearch document fields.
4. Parse `values` JSONB column.
5. Apply field indexing rules: split `values` into `values` (searchable) / `rawValues` (not searchable) **in the OpenSearch document only** (Postgres stores a single `values` column — the split is an indexing concern, not a storage concern).
6. Target index determined by tenant + modelId from row data.

## Decided: Transaction Boundaries

All multi-statement mutations wrapped in transactions:

- **Publish:** `SELECT FOR UPDATE` + update is_published flags (see Versioning section above).
- **Create revision:** Unset old is_latest + insert new row.
- **Delete entry:** Delete all revisions for entry_id.
- **Move to bin:** Update wby_deleted flag on all revisions.
- Single-row operations (update single revision, simple get) don't need explicit transactions.

## Resolved Questions

- **Q2 Model-to-DDL mapping:** Resolved. All model tables share the same DDL (system columns + `values` JSONB). No per-field columns. Model create = `CREATE TABLE` with fixed schema. Model field changes = no DDL needed.
- **Q3 storageId mapping:** Resolved. With `values` as JSONB, storageId is the key inside the JSON object (same as current DDB pattern). No column names to manage.
- **Q4 Indexes on JSONB nested paths:** Resolved. Not needed. OpenSearch handles all field-level filtering. PG indexes only on system columns for point lookups.
- **Q7 Tenant decoding in WAL worker:** Resolved. Tenant is a column in every row. WAL change events include full row data, so tenant is available directly.

## Resolved: WAL Worker Deployment

Separate process managed by PM2 (or similar process manager). Two processes in production:

1. **API server** — handles HTTP requests, CRUD operations on Postgres.
2. **WAL worker** — consumes Postgres logical replication stream, transforms entries, pushes to OpenSearch.

Both spawned by process manager. Independent lifecycle — worker can restart without affecting API.

## Resolved: Concurrent Mutation Handling

**Upsert pattern** — same as current DDB operations. Use `INSERT ... ON CONFLICT DO UPDATE`:

```sql
INSERT INTO webiny_cms_{modelId} (id, entry_id, version, values, ...)
VALUES ('abc123#0003', 'abc123', 3, '{"title":"Hello"}', ...)
ON CONFLICT (id) DO UPDATE SET
    values = EXCLUDED.values,
    saved_on = EXCLUDED.saved_on,
    modified_on = EXCLUDED.modified_on,
    revision_saved_on = EXCLUDED.revision_saved_on,
    revision_saved_by = EXCLUDED.revision_saved_by,
    revision_modified_on = EXCLUDED.revision_modified_on,
    revision_modified_by = EXCLUDED.revision_modified_by,
    status = EXCLUDED.status,
    locked = EXCLUDED.locked,
    revision_description = EXCLUDED.revision_description;
```

**Column mutability rules:**
- **Never updated via upsert:** `id`, `entry_id`, `model_id`, `tenant`, `locale`, `version`, `created_on`, `created_by`, `revision_created_on`, `revision_created_by`
- **Updated via upsert:** `values`, `saved_on`, `modified_on`, `revision_saved_*`, `revision_modified_*`, `status`, `locked`, `revision_description`
- **Updated only via explicit transaction (flag swaps):** `is_latest`, `is_published` (always via `SELECT FOR UPDATE`, see Versioning section)
- **Updated by specific operations:** `deleted_on/by`, `wby_deleted`, `bin_original_folder_id` (moveToBin); `restored_on/by` (restoreFromBin); `first_published_on/by`, `last_published_on/by`, `revision_first_published_on/by`, `revision_last_published_on/by` (publish)

If revision exists, update. If not, create. Postgres handles atomically.

## Resolved: Full Re-index Strategy

Two mechanisms:

1. **CLI command:** `yarn webiny reindex --model=article` (or `--all`). Reads rows from Postgres, bulk-indexes to OpenSearch with configurable batch size and throttling.

2. **Background task:** Same pattern as existing Elasticsearch reindex background task. Triggered via admin API or automatically on WAL slot invalidation. Runs as a managed background task with progress tracking.

Both use the same core logic:
- Read entries from Postgres model table in batches (e.g., 500 rows per batch).
- Transform each entry to index-ready format (same transformation pipeline as WAL worker).
- Bulk-index to OpenSearch.
- Throttle to avoid overwhelming PG/OS (configurable delay between batches).

**Zero-downtime re-index procedure:**
1. Create new versioned index (e.g., `t1-headless-cms-article-v2`).
2. **Temporarily point WAL worker at BOTH old and new index** (dual-write during re-index).
3. Bulk-index all existing rows from Postgres into new index.
4. Once bulk complete, swap alias to new index.
5. Stop dual-write — WAL worker now writes only to new index.
6. Delete old index after verification.

This ensures no gap between re-index start time and alias swap — WAL worker keeps both indexes current during the migration.

**WAL slot invalidation during re-index:** If slot becomes invalid during a long re-index, the re-index itself IS the recovery — it reads directly from Postgres, not from WAL. After re-index completes, create a new replication slot and resume WAL consumption from current position.

## All Questions Resolved

No remaining open questions. Ready for implementation planning.
