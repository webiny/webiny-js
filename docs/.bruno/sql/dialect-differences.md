# Dialect Differences — PostgreSQL vs MySQL vs SQLite

Every area where the three target dialects behave differently, requiring either abstraction layers, dialect-specific code paths, or documented limitations.

---

## JSONB for List Fields

List fields (`multipleValues: true`) store arrays as JSON strings in a single text column. Querying individual elements inside the serialized array requires dialect-specific JSON operations.

**Example:** A multi-value text field stores `'["red","green","blue"]'`. Query: "find entries where colors contains red."

| Dialect | Query Syntax | Index Type | Performance |
|---|---|---|---|
| PostgreSQL | `column::jsonb @> '"red"'` | GIN index | Fast at millions of rows |
| MySQL 8.0.17+ | `JSON_CONTAINS(column, '"red"')` | Multi-valued index | Decent |
| SQLite | `EXISTS (SELECT 1 FROM json_each(column) WHERE value = 'red')` | None | Full table scan |

Knex does not abstract over JSON operations. List field queries require raw SQL with dialect detection.

**Typical CMS arrays are small** (tags, categories, multi-select) — 2-20 elements. JSONB performance with proper indexes is not a concern for PostgreSQL/MySQL. SQLite without JSON indexes is the weak point.

---

## NULL Sort Order

Sorting on nullable columns produces inconsistent ordering across dialects. This is a real use case — dynamic zone template fields where entries using a different template have NULLs, and optional fields that were never set.

| Dialect | NULLs in ASC | NULLs in DESC | `NULLS FIRST/LAST` syntax |
|---|---|---|---|
| PostgreSQL | Last | First | Supported |
| MySQL | First | Last | **Not supported** |
| SQLite | First | Last | **Not supported** |

PostgreSQL disagrees with MySQL/SQLite on ASC ordering (NULLs last vs first).

### Possible Solutions

1. **`CASE WHEN` prefix in ORDER BY:**
   ```sql
   ORDER BY CASE WHEN column IS NULL THEN 1 ELSE 0 END, column ASC
   ```
   Works in all dialects. NULLs always sort last in ASC.

2. **`COALESCE` with sentinel values:**
   ```sql
   ORDER BY COALESCE(column, 'ZZZZZZ') ASC
   ```
   Fragile — sentinel must be greater than all real values.

3. **Dialect-specific SQL:**
   PostgreSQL uses `NULLS LAST`, MySQL/SQLite use `CASE WHEN`. Adds branching.

Option 1 is the safest cross-dialect approach.

---

## Unicode Collation

String comparison and sorting behavior differs fundamentally:

| Dialect | Default Collation | Unicode Sorting | Case Sensitivity |
|---|---|---|---|
| PostgreSQL | `en_US.UTF-8` (database-level) | Locale-aware | Case-sensitive |
| MySQL | `utf8mb4_0900_ai_ci` (column-level) | Configurable per column | Case-insensitive (with `_ci`) |
| SQLite | `BINARY` | **Byte-order only** | Case-sensitive |

### SQLite Impact

SQLite sorts by raw byte values:
- `Ä` sorts after `Z` (not after `A` as expected in German)
- Chinese characters sort by Unicode codepoint, not by pinyin or stroke order
- Emoji and special characters sort by codepoint

If SQLite is a production target for multilingual content, this needs explicit handling:
- **ICU extension** — adds locale-aware collation to SQLite
- **Application-level sorting** — sort in JavaScript after fetching, but breaks pagination

### `LIKE` Case Sensitivity

| Dialect | `LIKE` behavior |
|---|---|
| PostgreSQL | Case-sensitive (`ILIKE` for insensitive) |
| MySQL | Case-insensitive by default (depends on collation) |
| SQLite | Case-insensitive for ASCII only, case-sensitive for non-ASCII |

The current implementation wraps all LIKE operations in `LOWER()` to normalize behavior across dialects. This works correctly but prevents index usage (see [Query Performance](./query-performance.md#lower-kills-index-usage)).

---

## Boolean Representation

| Dialect | Boolean type | Storage |
|---|---|---|
| PostgreSQL | Native `BOOLEAN` | `true`/`false` |
| MySQL | `TINYINT(1)` | `1`/`0` |
| SQLite | Integer | `1`/`0` |

Knex handles the translation transparently. JavaScript `true`/`false` values are correctly mapped per dialect. Not a pain point — noting for awareness.

---

## Full-Text Search Mechanisms

See [Query Performance — Full-Text Search](./query-performance.md#full-text-search) for the full analysis. Summary of dialect differences:

| Dialect | Mechanism | Setup | Query Syntax |
|---|---|---|---|
| PostgreSQL | `tsvector` column + GIN index | `ALTER TABLE ADD COLUMN ... tsvector` + trigger/generated | `WHERE tsv @@ to_tsquery('term')` |
| MySQL | `FULLTEXT` index on InnoDB | `ALTER TABLE ADD FULLTEXT(col1, col2)` | `WHERE MATCH(col1, col2) AGAINST('term')` |
| SQLite | `FTS5` virtual table | `CREATE VIRTUAL TABLE ... USING fts5(...)` | `WHERE fts_table MATCH 'term'` |

All three are completely different architectures. None go through Knex's query builder.

---

## ALTER TABLE Behavior

| Behavior | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| `ADD COLUMN` | Fast (metadata only) | Fast (metadata only, MySQL 8+) | **Rewrites entire table** |
| Concurrent DDL | `ACCESS EXCLUSIVE` lock | DDL lock | Single-writer lock |
| Column already exists error | `42701` | `1060` | `duplicate column name` |
| Transactional DDL | Yes (DDL in transactions) | No (implicit commit) | Partial (some DDL) |

### SQLite ALTER TABLE Limitation

SQLite rewrites the entire table on `ADD COLUMN` in older versions. SQLite 3.35.0+ supports fast `ADD COLUMN` (metadata only). Verify the `better-sqlite3` version bundles a recent enough SQLite.

### Error Code Mapping

Need to map "column already exists" errors per dialect to swallow idempotent ADD COLUMN attempts:
- PostgreSQL: error code `42701`
- MySQL: error code `1060`
- SQLite: error message contains `duplicate column name`

Other errors (disk full, permission denied, connection lost) should bubble up as model update failures.

---

## Date/Time Types

| Variant | PostgreSQL | MySQL | SQLite | Our Storage |
|---|---|---|---|---|
| `date` | `DATE` | `DATE` | text | ISO 8601 text |
| `dateTimeWithoutTimezone` | `TIMESTAMP` | `DATETIME` | text | ISO 8601 text |
| `dateTimeWithTimezone` | `TIMESTAMPTZ` | `TIMESTAMP` | text | ISO 8601 text |
| `time` | `TIME` | `TIME` | text/integer | Numeric seconds |

Storing dates as ISO 8601 text works across all dialects — lexicographic comparison is correct for ISO 8601 format. Native date types could be used per dialect for better validation and query optimization, but text storage is the safe cross-dialect default.

Time is stored as numeric seconds (`hours*3600 + minutes*60 + seconds`), enabling native numeric comparisons and sorting in all dialects. Native `TIME` type can be used where the dialect supports it.
