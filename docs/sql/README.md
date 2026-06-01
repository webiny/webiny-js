# SQL Storage for Webiny Headless CMS

Date: 2026-06-01
Package: `@webiny/api-headless-cms-sql`
Branch: `bruno/feat/api-headless-cms-sql`

## Overview

SQL storage replaces both DynamoDB and OpenSearch as a **single store**. Every operation that today gets split across DDB (storage) and OpenSearch (search/filtering) must work in SQL alone.

Supported dialects: **PostgreSQL**, **MySQL**, **SQLite** (including possible production use).

## Architecture

- **Table-per-model** — each CMS model gets its own SQL table with real columns per field.
- **One row per revision** — boolean `isLatest`/`isPublished` flags (no separate L/P/REV records like DDB).
- **Nested fields flattened** — object fields decomposed to child columns; 2+ levels deep use hash-based column names; list-of-objects stored as JSON.
- **Tenant isolation** — table-per-tenant (default) or shared tables with `tenant` column.
- **Keyset pagination** — cursor = base64(JSON of sort values + id tiebreaker).
- **Transactions** — multi-step operations (publish, unpublish, moveToBin, etc.) wrapped in SQL transactions.
- **Schema sync at startup** — all model tables created/updated at application start, not lazily during entry operations.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Never drop columns | `storageId` is immutable and encodes type; dead columns accumulate, cleaned up later |
| Never drop tables | Model deletion leaves the table; cleanup tool in later phase |
| No foreign keys | Refs are stored IDs; application handles dangling refs (same as DDB) |
| No JSONB for scalar fields | Real columns enable native SQL filtering and sorting |
| JSONB for list fields | Array element queries require dialect-specific JSON operations |
| Bypass compression transforms | SQL needs plain text for LIKE queries; DDB compressed to fit 400KB limit |
| `live_version` integer | Normalized from `live: JSON({version: N})` — simpler, indexable |
| `time` as numeric seconds | `hours*3600 + minutes*60 + seconds` — enables numeric comparisons |

## Documents

| Document | Description |
|---|---|
| [Pain Points](./pain-points.md) | All known limitations and scaling cliffs |
| [Dialect Differences](./dialect-differences.md) | PostgreSQL vs MySQL vs SQLite behavior differences |
| [Schema Management](./schema-management.md) | Table lifecycle, ALTER TABLE, startup sync |
| [Query Performance](./query-performance.md) | Full-text search, indexing, COUNT, N+1 |
| [Data Handling](./data-handling.md) | Transforms, date/time, pagination, TTL |
| [Transactions](./transactions.md) | Atomicity, locking, SQLite single-writer |
| [Field-to-Column Mapping](./field-to-column-mapping.md) | How CMS field types map to SQL columns |

## Non-Issues (Resolved by Design)

These concerns were evaluated and found to be non-problems:

- **Field renames** — `storageId` is immutable; renaming `fieldId` doesn't affect columns.
- **Field type changes** — new type = new `storageId` = new column.
- **Concurrent ALTER TABLE** — schema changes at startup + model CRUD only.
- **Cross-model queries** — none exist in the CMS; every query is single-model.
- **Table count limits** — no practical limit in any dialect (unlike OpenSearch's 1000 index limit).
- **Dynamic zone column sparsity** — wide sparse tables are acceptable; NULLs are cheap.
- **Empty array vs null** — no semantic distinction in the CMS.
- **Relevance-ranked search** — not needed; users provide explicit sort fields.
- **Referential integrity** — no FK constraints; same approach as DDB.
- **Entry-level meta sync** — single `UPDATE ... WHERE entryId = ?`; SQL advantage over DDB.
