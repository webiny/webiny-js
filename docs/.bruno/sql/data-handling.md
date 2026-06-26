# Data Handling

How data transforms, date/time, pagination, and TTL work in the SQL storage layer.

---

## Storage Transform Override

### The Problem

The CMS applies `EntryToStorageTransform` before values reach SQL storage operations. Three transforms compress data:

| Transform | Field Type | Searchable | Effect |
|---|---|---|---|
| `LongTextStorageTransform` | `long-text` | **Yes** (`contains`, `not_contains`) | Gzip compresses text → `{compression: "gzip", value: "base64..."}` |
| `RichTextStorageTransform` | `rich-text` | No | Same gzip compression |
| `JsonStorageTransform` | `json` | No | Same gzip compression |

### Why It's a Problem

In DDB+OS, this works because the two stores handle different concerns:
- **DDB** stores the compressed version (saves space, fits the 400KB item limit)
- **OpenSearch** receives the uncompressed raw text via `longTextIndexing.ts` (uses `rawValue`, not the compressed `value`) and indexes it for search

SQL is a single store. `entryToRow` receives the already-compressed `storageEntry`, JSON-stringifies the compression object into a column, and LIKE queries match against base64 gibberish instead of actual text.

### The Solution

Register SQL-specific storage transforms that bypass compression. The SQL feature decorates the `StorageTransformRegistry` to return pass-through (no-op) transforms for `long-text`, `rich-text`, and `json` field types.

DDB compressed because of its 400KB item size limit. SQL has no such limit (PostgreSQL TEXT: 1GB, MySQL LONGTEXT: 4GB, SQLite TEXT: unlimited).

### Encrypted Fields

`EncryptedTextStorageTransform` is **not** overridden. Encrypted fields:
- Store opaque blobs (security requirement)
- Are not searchable (`isSearchable: false`)
- Are never queried/filtered
- Decryption happens in the CMS layer on read (same as DDB)

---

## Date/Time Storage

Four CMS datetime variants, each with a specific storage strategy:

| Variant | Storage Format | Sorting | Range Queries |
|---|---|---|---|
| `date` | ISO 8601 text (`2026-06-01`) | Lexicographic — correct | String comparison — correct |
| `dateTimeWithoutTimezone` | ISO 8601 text (`2026-06-01T12:00:00`) | Lexicographic — correct | String comparison — correct |
| `dateTimeWithTimezone` | ISO 8601 text (`2026-06-01T12:00:00Z`) | Lexicographic — correct | String comparison — correct |
| `time` | Numeric seconds (e.g., `43200` for 12:00:00) | Numeric — correct | Numeric comparison — correct |

### Why Text for Dates

ISO 8601 format is lexicographically ordered — `"2026-01-01" < "2026-12-31"` as a string comparison. This means:
- B-tree indexes work for range queries (once indexes are added)
- Sorting works correctly without type casting
- Cross-dialect compatibility (no native date type differences)

### Why Numeric for Time

`time` variant stores `hours * 3600 + minutes * 60 + seconds`:
- `"09:30:00"` → `34200`
- `"17:45:30"` → `63930`

Enables native numeric comparisons and sorting. Native `TIME` type can be used where the dialect supports it, but numeric is the safe cross-dialect default.

### `live_version`

The `live` field is normalized from `JSON.stringify({version: N})` to a `live_version` integer column. Simpler storage, directly indexable, no JSON parsing on read.

---

## Keyset Pagination with NULL Sort Values

### The Bug

The `applyKeysetCondition` function builds compound WHERE clauses for cursor-based pagination:

```sql
WHERE (field1 > val1)
   OR (field1 = val1 AND id > id1)
```

When `val1` is NULL (optional field, never set), SQL comparison with NULL returns UNKNOWN:

```sql
field1 > NULL    -- UNKNOWN (not true, not false)
field1 = NULL    -- UNKNOWN
```

The entire OR branch is skipped. Entries with NULL in the sort column are **silently dropped** from paginated results.

### The Fix

NULL-aware keyset conditions:

```sql
-- For ASC (NULLs last):
WHERE (field1 > val1)
   OR (field1 = val1 AND id > id1)
   OR (field1 IS NOT NULL AND val1 IS NULL)  -- non-null sorts before null

-- When cursor value IS NULL:
WHERE (field1 IS NULL AND id > id1)          -- same null group, tiebreak by id
```

This is entangled with the NULL sort order consistency issue (see [Dialect Differences — NULL Sort Order](./dialect-differences.md#null-sort-order)). The keyset condition must match the ORDER BY null-handling strategy.

---

## TTL / Expiration

### DDB Behavior

DynamoDB has native TTL. Set `expiresAt` as a Unix timestamp on an item, DDB automatically deletes it after that time. Zero application code needed.

### SQL Gap

SQL has no native TTL mechanism. The `expiresAt` column is stored but never acted upon by the storage layer.

### Solution

A **background cleanup mechanism** (cron job or scheduled task) that periodically runs:

```sql
DELETE FROM {each model table} WHERE expiresAt IS NOT NULL AND expiresAt < {current_unix_timestamp}
```

Considerations:
- Must iterate all model tables (or maintain a registry of tables with TTL entries)
- Should run in batches to avoid long-running transactions
- Frequency depends on TTL precision requirements (minute-level? hour-level?)
- Should respect tenant isolation (shared tables need tenant-aware cleanup)

---

## Round-Trip Fidelity

The `entryToRow` → SQL column → `rowToEntry` round-trip preserves data correctly:

| Input | Column Value | Output | Correct? |
|---|---|---|---|
| `"hello"` | `"hello"` | `"hello"` | Yes |
| `42` | `42` | `42` | Yes |
| `true` | `1`/`true` (dialect) | `true` | Yes (Knex handles) |
| `null` | `NULL` | `null` | Yes |
| `undefined` | `NULL` | `null` | Yes (`undefined` → `null` is acceptable) |
| `[]` | `"[]"` | `[]` | Yes (JSON parse detects `[`) |
| `{a: 1}` | `'{"a":1}'` | `{a: 1}` | Yes (JSON parse detects `{`) |
| `{a: null, b: null}` | Two NULL columns | `null` | Yes (null object collapse) |

No semantic distinction between `null`, `undefined`, and absent values in the CMS. The round-trip is safe.
