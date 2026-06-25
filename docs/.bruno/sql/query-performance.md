# Query Performance

Known performance limitations and scaling cliffs in the SQL storage implementation.

---

## Full-Text Search

### Current Implementation

The global `search` parameter and `contains`/`not_contains` operators use:

```sql
LOWER(column) LIKE LOWER('%term%')
```

ORed across all `isFullTextSearchable` fields.

### Problem

A leading-wildcard LIKE (`%term%`) is a **full table scan** in every dialect. No B-tree index can help. With 5 searchable fields and 2 million rows, every search query scans 10 million column values.

### How DDB+OS Handles This

DDB stores compressed text. OpenSearch receives the uncompressed raw text via `longTextIndexing.ts` and indexes it in an inverted index. Full-text search runs against the OpenSearch index — fast, pre-computed, relevance-ranked.

SQL has no separate search index. It is both the storage and query engine.

### Dialect-Specific FTS Solutions

| Dialect | Mechanism | Setup Cost | Query Syntax |
|---|---|---|---|
| PostgreSQL | `tsvector` + GIN | Add generated tsvector column + GIN index per searchable field | `WHERE tsv @@ to_tsquery('term')` |
| MySQL | `FULLTEXT` index | `ALTER TABLE ADD FULLTEXT(col1, col2, ...)` | `WHERE MATCH(col1, col2) AGAINST('term')` |
| SQLite | `FTS5` virtual table | Create a mirror virtual table + keep it in sync | `WHERE fts_table MATCH 'term'` |

All three are completely different architectures with different syntax, indexing, maintenance, and capabilities. None go through Knex's query builder — all require raw dialect-specific SQL.

### v1 Decision

Ship with `LIKE '%term%'`. Document as a known performance limitation. FTS is a later-phase optimization requiring per-dialect implementations.

---

## LOWER() Kills Index Usage

### Current Implementation

Both `contains` and `startsWith` operators wrap columns in `LOWER()`:

```sql
-- contains
LOWER(column) LIKE LOWER('%term%')

-- startsWith
LOWER(column) LIKE LOWER('term%')
```

### Problem

`startsWith` with a trailing-only wildcard (`term%`) is normally indexable — a B-tree index can seek to the prefix. But wrapping in `LOWER()` prevents index usage because the index is on the raw column value, not on `LOWER(column)`.

This is different from the `contains` problem (which needs FTS regardless). `startsWith` could be fast with the right index, but `LOWER()` blocks it.

### Solutions Per Dialect

| Dialect | Approach |
|---|---|
| PostgreSQL | Functional index: `CREATE INDEX ON table (LOWER(column))` |
| MySQL | Generated column + index: `ALTER TABLE ADD lower_col VARCHAR GENERATED ALWAYS AS (LOWER(column)), ADD INDEX(lower_col)` |
| SQLite | No solution — cannot index expressions |

Alternative: use case-insensitive collation at the database/table/column level, eliminating the need for `LOWER()` entirely. MySQL's default `utf8mb4_0900_ai_ci` is already case-insensitive.

---

## Field Column Indexes

### Current State

Only meta columns are indexed:
- `id` (primary key)
- `entryId` (B-tree)
- `isLatest` (B-tree)
- `isPublished` (B-tree)
- `tenant` (B-tree, shared tables only)
- `version` (B-tree)

**No user-defined field columns are indexed.** Every filter or sort on a custom field (e.g., `title_contains`, `price_gte`, sort by `createdAt`) is a full table scan.

### Impact

At small scale (thousands of rows) — negligible. At millions of rows per model table, any filtered list query becomes slow.

### Future Strategy

The CMS model already has `searchable` and `sortable` flags per field. These could drive automatic index creation:

- `searchable: true` → B-tree index on the column (helps `eq`, `in`, `gt`, `lt`, `between`, `startsWith` without LOWER)
- `sortable: true` → B-tree index on the column (helps ORDER BY)

Considerations:
- More indexes = slower INSERT/UPDATE operations
- Dynamic zone fields create sparse columns — indexing sparse columns wastes space
- Index creation on existing large tables requires `CREATE INDEX CONCURRENTLY` (PostgreSQL) to avoid locking
- Need an index lifecycle: create on field add, drop on field delete (or leave as dead indexes alongside dead columns)

---

## COUNT(*) Doubles Query Cost

### Current Implementation

Every `list` operation runs two queries:

```sql
-- Query 1: Count
SELECT COUNT(*) FROM table WHERE ...

-- Query 2: Data
SELECT * FROM table WHERE ... ORDER BY ... LIMIT ...
```

### Problem

Both queries evaluate the same WHERE clause against the same rows. The COUNT query is effectively a full re-run of the filtered query without the LIMIT, doubling the total work.

PostgreSQL's `COUNT(*)` is particularly slow on large tables due to MVCC — it must check row visibility for every candidate row. `COUNT(id)` is equivalent (id is never NULL) and does not help.

### Why We Need It

The UI requires the exact total count for pagination controls.

### Possible Future Optimizations

1. **Estimate count** — PostgreSQL's `EXPLAIN` output includes a row estimate. Fast but approximate.
2. **Cached counts** — maintain a materialized count per filter combination. Complex to invalidate.
3. **Count limit** — `SELECT COUNT(*) ... LIMIT 10001`. If > 10000, return "10000+" instead of exact count.
4. **Parallel queries** — run COUNT and data queries concurrently (already possible with Promise.all).
5. **Window function** — `SELECT *, COUNT(*) OVER() FROM table WHERE ... LIMIT N`. Single query, but the window function still scans all matching rows.

---

## N+1 Query Problem

### How DDB Solves It

DDB uses DataLoaders to batch multiple single-entry lookups into a single `BatchGetItem` call. When a GraphQL resolver fetches a list of 20 entries and each has a ref field, the 20 `getPublishedRevisionByEntryId` calls are batched into one network request.

### SQL Without Batching

Each lookup is an individual query:

```sql
SELECT * FROM table WHERE entryId = 'abc' AND isPublished = true LIMIT 1
SELECT * FROM table WHERE entryId = 'def' AND isPublished = true LIMIT 1
-- ... 18 more
```

20 entries with 2 ref fields each = 40 individual queries per list request.

### Solution

Implement a DataLoader-equivalent in the SQL storage layer that coalesces lookups within the same tick:

```sql
-- Instead of 20 individual queries:
SELECT * FROM table WHERE entryId IN ('abc', 'def', ...) AND isPublished = true
```

This is a standard pattern (facebook/dataloader). The SQL storage layer needs its own implementation, batching by operation type (`getByIds`, `getLatestByIds`, `getPublishedByIds`).
