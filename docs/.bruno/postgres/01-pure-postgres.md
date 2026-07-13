# Headless CMS Storage Operations: Pure Postgres

> **Note:** This document describes an earlier design exploration for a pure-Postgres approach with per-field columns. The final decided architecture is in `04-decisions.md`, which uses a single `values` JSONB column for user fields and delegates all filtering to OpenSearch (see `02-postgres-plus-opensearch.md`). This document is retained as reference for the pure-PG approach and its trade-offs.

## Overview

Replace DynamoDB (+ optional OpenSearch) with a single Postgres database for all CMS storage operations: CRUD, filtering, sorting, full-text search, and aggregations.

**Target scale:** Tens of millions of records per model.

## Architecture: Table-Per-Model

Each CMS content model gets its own Postgres table. When a user creates a model called `Article`, the system creates a table like `webiny_cms_article`.

### Table Structure

Every model table has two categories of columns:

**System columns (fixed, same for every model):**

```sql
CREATE TABLE webiny_cms_{modelId} (
    -- Identity
    id              TEXT        PRIMARY KEY,
    entry_id        TEXT        NOT NULL,
    
    -- Versioning
    version         INTEGER     NOT NULL,
    is_latest       BOOLEAN     NOT NULL DEFAULT false,
    is_published    BOOLEAN     NOT NULL DEFAULT false,
    locked          BOOLEAN     NOT NULL DEFAULT false,
    status          TEXT        NOT NULL DEFAULT 'draft',
    
    -- Tenant / Locale
    tenant          TEXT        NOT NULL,
    locale          TEXT        NOT NULL,
    
    -- Location (folder)
    location_folder_id TEXT,
    
    -- Timestamps
    created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
    modified_on     TIMESTAMPTZ,
    saved_on        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_on      TIMESTAMPTZ,
    first_published_on TIMESTAMPTZ,
    last_published_on  TIMESTAMPTZ,
    
    -- Identity references (stored as JSONB — { id, displayName, type })
    created_by      JSONB       NOT NULL,
    modified_by     JSONB,
    saved_by        JSONB       NOT NULL,
    deleted_by      JSONB,
    
    -- Soft delete
    wby_deleted     BOOLEAN     NOT NULL DEFAULT false,
    
    -- Revision description
    revision_description TEXT
);
```

**User-defined field columns (dynamic, based on model definition):**

Top-level scalar fields become real typed columns:

| CMS Field Type | Postgres Column Type |
|---------------|---------------------|
| text          | TEXT                |
| long-text     | TEXT                |
| rich-text     | JSONB               |
| number        | DOUBLE PRECISION    |
| boolean       | BOOLEAN             |
| datetime      | TIMESTAMPTZ         |
| file          | TEXT (file ID)      |
| ref           | TEXT (entry ID)     |
| object        | JSONB               |
| dynamic-zone  | JSONB               |

Multi-value (list) fields use Postgres arrays (`TEXT[]`, `DOUBLE PRECISION[]`, etc.) for scalars or `JSONB` for complex types.

### Example

Model "Article" with fields: `title (text)`, `price (number)`, `published (boolean)`, `metadata (object)`, `content (dynamic-zone)`:

```sql
CREATE TABLE webiny_cms_article (
    -- system columns (as above)
    ...
    
    -- user-defined columns
    title       TEXT,
    price       DOUBLE PRECISION,
    published   BOOLEAN,
    metadata    JSONB,          -- object field -> JSONB
    content     JSONB           -- dynamic-zone -> JSONB
);
```

## Schema Lifecycle

### Model Created

1. `CREATE TABLE` with system columns + user-defined field columns.
2. Create system indexes (see Indexing section).
3. Create field-level indexes for all user-defined fields.
4. Create full-text search vector column + index.

### Field Added

```sql
ALTER TABLE webiny_cms_{modelId} ADD COLUMN {fieldId} {type};
```

- `ADD COLUMN` with no default = instant (Postgres 11+, metadata-only change).
- `ADD COLUMN` with `DEFAULT` value = instant (Postgres 11+).
- Then create indexes for the new field.

### Field Removed

```sql
ALTER TABLE webiny_cms_{modelId} DROP COLUMN {fieldId};
```

- `DROP COLUMN` = instant (marks column invisible, space reclaimed on next VACUUM/rewrite).
- Drop associated indexes.

### Field Type Changed

This is the hard case:

```sql
ALTER TABLE webiny_cms_{modelId} ALTER COLUMN {fieldId} TYPE {newType};
```

- **At 30M rows: full table rewrite + ACCESS EXCLUSIVE lock.** Table is locked for writes during rewrite.
- Mitigation strategies:
  - Add new column, backfill in batches, swap (application-level migration).
  - Use `pg_repack` or similar for online migration.
  - Discourage type changes on large models (UI warning).

### Model Deleted

```sql
DROP TABLE webiny_cms_{modelId};
```

Instant.

## Indexing Strategy

### System Indexes (created for every model table)

```sql
-- Primary lookups
CREATE INDEX idx_{modelId}_entry_latest 
    ON webiny_cms_{modelId} (tenant, locale, entry_id, is_latest) 
    WHERE is_latest = true;

CREATE INDEX idx_{modelId}_entry_published 
    ON webiny_cms_{modelId} (tenant, locale, entry_id, is_published) 
    WHERE is_published = true;

-- Listing (most common query pattern)
CREATE INDEX idx_{modelId}_list_latest 
    ON webiny_cms_{modelId} (tenant, locale, created_on DESC) 
    WHERE is_latest = true AND wby_deleted = false;

CREATE INDEX idx_{modelId}_list_published 
    ON webiny_cms_{modelId} (tenant, locale, created_on DESC) 
    WHERE is_published = true AND wby_deleted = false;

-- Revisions for an entry
CREATE INDEX idx_{modelId}_revisions 
    ON webiny_cms_{modelId} (tenant, locale, entry_id, version);

-- Trash bin
CREATE INDEX idx_{modelId}_deleted 
    ON webiny_cms_{modelId} (tenant, locale, deleted_on DESC) 
    WHERE wby_deleted = true;

-- Folder listing
CREATE INDEX idx_{modelId}_folder 
    ON webiny_cms_{modelId} (tenant, locale, location_folder_id) 
    WHERE is_latest = true AND wby_deleted = false;
```

### User Field Indexes

For **top-level scalar fields** (text, number, boolean, datetime, ref, file):

```sql
-- B-tree index per field (supports =, <, >, <=, >=, BETWEEN, ORDER BY)
CREATE INDEX CONCURRENTLY idx_{modelId}_{fieldId} 
    ON webiny_cms_{modelId} ({fieldId});
```

For **nested paths inside JSONB columns** (object fields, dynamic zones):

```sql
-- Expression index for a specific nested path
CREATE INDEX CONCURRENTLY idx_{modelId}_{path_slug} 
    ON webiny_cms_{modelId} ((metadata->>'seoScore')::integer);

-- GIN index on the whole JSONB column (for @> containment / equality queries)
CREATE INDEX CONCURRENTLY idx_{modelId}_{fieldId}_gin 
    ON webiny_cms_{modelId} USING gin ({fieldId} jsonb_path_ops);
```

### Index Lifecycle for Nested Fields

When a model is created or updated, the system must:

1. Walk the full field tree (including object children, dynamic-zone templates).
2. For every field at every nesting level, determine the JSONB path.
3. Create an expression index for each filterable/sortable nested path.
4. Use `CREATE INDEX CONCURRENTLY` (no table lock, safe for production).
5. When fields are removed, drop the corresponding indexes.

**Concern: Index count.** A model with 10 top-level fields + 3 objects with 5 nested fields each + 2 dynamic zones with 3 templates and 4 fields each = 10 + 15 + 24 = **49 field indexes** + 7 system indexes = **~56 total indexes** per model table. At 30M rows:

- Each B-tree index size depends on field cardinality, data distribution, and NULL density.
- 56 indexes = significant storage overhead (estimate 15-25 GB per model, varies widely).
- Every INSERT/UPDATE touches all indexes — substantial write amplification.
- `INSERT` latency increases significantly compared to a table with 3-5 indexes.

## Filtering (WHERE Clauses)

### Top-Level Fields

Direct column access. Standard SQL:

```sql
WHERE title = 'Hello'
WHERE price > 100 AND price < 500
WHERE published = true
WHERE created_on > '2024-01-01'
```

All use B-tree indexes. Fast at any scale.

### Nested Fields (inside JSONB)

```sql
-- Equality (uses GIN index)
WHERE metadata @> '{"seo": {"score": 80}}'

-- Range (uses expression index if one exists)
WHERE (metadata->'seo'->>'score')::integer > 80

-- Text contains inside nested (uses expression index)
WHERE metadata->'seo'->>'title' ILIKE '%postgres%'

-- Dynamic zone field
WHERE (content->0->>'heading') = 'Welcome'
```

### AND / OR Conditions

```sql
WHERE (title = 'Hello' OR price > 100)
  AND published = true
  AND (metadata->'seo'->>'score')::integer > 50
```

Postgres query planner handles AND/OR with index scans + bitmap merges.

### Operators Mapping

| CMS Operator    | SQL                                    |
|----------------|----------------------------------------|
| eq             | `= value`                              |
| not_eq         | `!= value`                             |
| in             | `= ANY(array)`                         |
| not_in         | `!= ALL(array)`                        |
| contains       | `ILIKE '%value%'`                      |
| not_contains   | `NOT ILIKE '%value%'`                  |
| startsWith     | `LIKE 'value%'`                        |
| gt             | `> value`                              |
| gte            | `>= value`                             |
| lt             | `< value`                              |
| lte            | `<= value`                             |
| between        | `BETWEEN a AND b`                      |

## Sorting

### Top-Level Fields

```sql
ORDER BY title ASC
ORDER BY price DESC, created_on ASC
```

Uses B-tree indexes. Multi-field sort works if a composite index exists or via index scan + sort.

### Nested Fields

```sql
ORDER BY (metadata->'seo'->>'score')::integer DESC
```

Requires expression index on that path. Without index = sort in memory (fine for small result sets after WHERE filtering, catastrophic for full table scans).

## Pagination

**Keyset (cursor-based) pagination** — required for 30M rows. Offset pagination degrades linearly.

```sql
-- First page
SELECT * FROM webiny_cms_article
WHERE tenant = 't1' AND locale = 'en-US' AND is_latest = true AND wby_deleted = false
ORDER BY created_on DESC, id DESC
LIMIT 50;

-- Next page (cursor = last row's created_on + id)
SELECT * FROM webiny_cms_article
WHERE tenant = 't1' AND locale = 'en-US' AND is_latest = true AND wby_deleted = false
  AND (created_on, id) < ('2024-06-15T10:00:00Z', 'abc123')
ORDER BY created_on DESC, id DESC
LIMIT 50;
```

Keyset pagination is O(1) regardless of page depth. Requires the sort column(s) + tie-breaker (id) to be indexed together.

## Full-Text Search

### Approach: tsvector Generated Column

```sql
-- Add a search vector column
ALTER TABLE webiny_cms_article 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(long_description, '')), 'B')
    ) STORED;

-- GIN index on it
CREATE INDEX idx_article_search ON webiny_cms_article USING gin (search_vector);
```

### Query

```sql
SELECT *, ts_rank(search_vector, query) AS rank
FROM webiny_cms_article, plainto_tsquery('english', 'postgres performance') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 50;
```

### Including JSONB Fields in Search

JSONB extraction operators (`->>`, `->`) are immutable, so they **can** be used in generated columns:

```sql
ALTER TABLE webiny_cms_article 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(metadata->>'description', '')), 'B')
    ) STORED;
```

For deeply nested or variable-structure JSONB (dynamic zones), a trigger is needed since the paths are not statically known:

```sql
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := /* dynamically built tsvector from all text fields */;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Limitations

- **Trigger overhead:** At 30M rows, maintaining tsvector on every INSERT/UPDATE adds measurable CPU cost. Benchmark needed for specific field counts.
- **No fuzzy/typo-tolerant search.** Need `pg_trgm` extension for that.
- **No relevance tuning** comparable to OpenSearch (no field boosting, analyzers, synonyms).
- **Rebuilding search vector on model change:** When fields are added/removed, the generated column or trigger must be regenerated and the search vector backfilled across all rows.

### Fuzzy Search with pg_trgm

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for ILIKE queries
CREATE INDEX idx_article_title_trgm 
    ON webiny_cms_article USING gin (title gin_trgm_ops);

-- Query
SELECT * FROM webiny_cms_article
WHERE title % 'postges'  -- fuzzy match with similarity threshold
ORDER BY similarity(title, 'postges') DESC;
```

## Multi-Tenancy

Table names include tenant context via table prefix or Postgres schemas:

**Option A: Table prefix**
```
webiny_t1_cms_article
webiny_t2_cms_article
```

**Option B: Postgres schemas**
```sql
CREATE SCHEMA tenant_t1;
CREATE TABLE tenant_t1.webiny_cms_article (...);
```

Schemas provide better isolation and simpler `SET search_path` switching.

## Risks and Concerns

### 1. Index Explosion
- 30-50 indexes per model table at 30M rows = significant index storage per model. Actual size depends on field cardinality, data distribution, and whether NULLs are indexed.
- Write amplification: every INSERT/UPDATE maintains all indexes.
- Mitigation: only index fields marked "filterable"/"sortable" in model definition. Rich-text and large text fields should not get B-tree indexes.
- **NULL handling:** Postgres includes NULLs in B-tree indexes by default. For sparse optional fields (e.g., dynamic zone fields that most entries don't have), use partial indexes: `CREATE INDEX ... WHERE field IS NOT NULL` to avoid bloated indexes.
- **Runtime index strategy needed:** What happens when a user filters on a field that was not marked "filterable"? Options: (a) reject the query, (b) fall back to sequential scan with warning, (c) auto-create index on first filter use (dangerous at 30M rows — `CREATE INDEX CONCURRENTLY` takes minutes).

### 2. ALTER COLUMN TYPE on Large Tables
- Full table rewrite + exclusive lock.
- At 30M rows: minutes to hours depending on hardware.
- Mitigation: warn user in UI, use background migration strategy.

### 3. JSONB Nested Field Query Performance
- Range queries on nested paths need per-path expression indexes.
- Without index: sequential scan at 30M rows = seconds to minutes.
- GIN only helps with equality/containment, not range or sort.

### 4. Full-Text Search Quality
- Postgres tsvector is functional but basic compared to OpenSearch.
- No built-in synonyms, stemming customization is limited, no field-level boosting.
- No "did you mean?" / fuzzy matching without pg_trgm.

### 5. Dynamic Zone Querying
- Dynamic zone content is inherently variable-structure JSONB.
- Querying "find entries where the 3rd content block's heading contains X" requires knowing the array position or scanning all elements.
- `jsonb_path_query` (SQL/JSON Path, Postgres 12+) helps but is not indexable for array element searches.
- Possible workaround: JSONB array containment with GIN, but limited to equality.

### 6. Autovacuum and Index Bloat
- With 30-50 indexes per table and heavy UPDATEs from the versioning pipeline (draft -> published -> new revision), autovacuum will struggle to keep bloat down.
- Consider: tuning `autovacuum_vacuum_scale_factor` lower for CMS tables, adjusting `FILLFACTOR` for tables with frequent updates, periodic `REINDEX CONCURRENTLY` for index bloat reclamation.
- Dead tuple accumulation from UPDATE-heavy workloads degrades index scan performance over time.

### 7. Connection Pooling
- Complex queries on large tables can hold connections for seconds.
- Need PgBouncer or built-in connection pooling.
- Estimate: minimum pool size should match expected concurrent users performing list/filter operations.

## Summary

| Aspect | Capability | Concern Level |
|--------|-----------|---------------|
| CRUD | Native SQL. Fast. | None |
| Top-level field filtering | B-tree indexes. Fast at any scale. | None |
| Nested field equality filter | GIN on JSONB. Works. | Low |
| Nested field range filter | Needs per-path expression index. | Medium |
| Nested field sorting | Needs per-path expression index. | Medium |
| Full-text search | tsvector + GIN. Functional. | Medium |
| Fuzzy search | pg_trgm. Works but separate index. | Medium |
| Dynamic zone querying | JSONB path queries. Limited indexing. | High |
| Index management | Must build lifecycle manager. | High |
| Write performance at scale | Many indexes = write amplification. | High |
| Schema evolution (add/drop field) | Instant. | None |
| Schema evolution (change type) | Table rewrite + lock. | High |
