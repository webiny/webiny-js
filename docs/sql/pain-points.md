# SQL Storage — Pain Points Summary

Quick reference of all known limitations. Each links to the detailed document covering that topic.

## Critical (Blocks Test Parity)

| # | Pain Point | Category | Detail |
|---|---|---|---|
| 1 | Storage transforms compress long-text, breaking LIKE queries | [Data Handling](./data-handling.md#storage-transform-override) | SQL needs plain text; DDB+OS split compressed/uncompressed across two stores |
| 2 | Keyset pagination silently drops entries with NULL sort values | [Data Handling](./data-handling.md#keyset-pagination-with-null-sort-values) | Bug — `WHERE column > NULL` evaluates to UNKNOWN |
| 3 | Plugin models missing from schema sync | [Schema Management](./schema-management.md#startup-schema-sync) | Plugin-registered models must participate in startup sync |

## Parity Gap (SQL Cannot Match DDB+OS Behavior)

| # | Pain Point | Category | Detail |
|---|---|---|---|
| 4 | No filtering/sorting inside list-of-objects or nested dynamic zones | [Field-to-Column Mapping](./field-to-column-mapping.md#list-of-objects-are-opaque-blobs) | OpenSearch can filter inside nested arrays; SQL stores them as opaque JSON blobs with no decomposition |

## Performance (Works Correctly, Scaling Cliff)

| # | Pain Point | Category | Detail |
|---|---|---|---|
| 5 | Full-text search uses `LIKE '%term%'` — full table scan | [Query Performance](./query-performance.md#full-text-search) | No index helps with leading wildcard; FTS needed per dialect |
| 6 | `LOWER()` prevents index usage on startsWith/contains | [Query Performance](./query-performance.md#lower-kills-index-usage) | Even trailing-wildcard startsWith becomes a scan |
| 7 | No indexes on user-defined field columns | [Query Performance](./query-performance.md#field-column-indexes) | All custom field filters/sorts are full table scans |
| 8 | `COUNT(*)` doubles every list query cost | [Query Performance](./query-performance.md#count-doubles-query-cost) | Runs filtered query twice — once for count, once for data |
| 9 | N+1 queries without DataLoader equivalent | [Query Performance](./query-performance.md#n1-query-problem) | Ref field resolution in lists produces per-item queries |
| 10 | Dead column accumulation | [Schema Management](./schema-management.md#dead-column-accumulation) | Deleted fields leave NULL columns forever |
| 11 | Orphaned tables from deleted models | [Schema Management](./schema-management.md#tables-are-never-dropped) | Tables persist after model deletion |

## Dialect-Specific

| # | Pain Point | Category | Detail |
|---|---|---|---|
| 12 | JSONB for list fields — three different syntaxes | [Dialect Differences](./dialect-differences.md#jsonb-for-list-fields) | PG `@>`, MySQL `JSON_CONTAINS`, SQLite `json_each` |
| 13 | NULL sort order inconsistency | [Dialect Differences](./dialect-differences.md#null-sort-order) | PG: NULLs last in ASC; MySQL/SQLite: NULLs first |
| 14 | SQLite single-writer locking | [Transactions](./transactions.md#sqlite-single-writer-locking) | Write transactions block all other connections |
| 15 | SQLite has no locale-aware Unicode sorting | [Dialect Differences](./dialect-differences.md#unicode-collation) | Byte-order comparison; broken for multilingual content |
| 16 | FTS mechanism differs per dialect | [Query Performance](./query-performance.md#full-text-search) | tsvector vs FULLTEXT vs FTS5 — no Knex abstraction |
| 17 | ALTER TABLE error types differ per dialect | [Schema Management](./schema-management.md#alter-table-error-handling) | Need per-dialect error catalog and handling |

## Operational

| # | Pain Point | Category | Detail |
|---|---|---|---|
| 18 | No TTL mechanism — needs background cleanup | [Data Handling](./data-handling.md#ttl--expiration) | DDB auto-deletes expired items; SQL needs a cron job |
