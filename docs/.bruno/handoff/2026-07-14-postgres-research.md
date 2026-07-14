# Session Handoff — 2026-07-14 — Postgres Storage Research

## What was done

- Explored current CMS storage architecture (DDB, DDB-ES, SQL backends)
- Researched 10 CMS systems (Strapi, Payload, Contentful, TYPO3, WordPress, AEM, Sanity, Directus, Drupal, Sitecore) for storage patterns, nested field filtering, API capabilities, and scaling limits
- Evaluated pure Postgres approach — rejected due to JSONB nested array query limitations at scale
- Designed Postgres + OpenSearch architecture with WAL logical replication for sync
- Made all architectural decisions: table structure, versioning, upsert pattern, transaction boundaries, re-index strategy
- Produced 4 design docs + README in `docs/.bruno/postgres/`
- 14 commits on branch `bruno/feat/api-headless-cms-postgres`

## Key decisions

- **Postgres + OpenSearch** (not pure Postgres) — OpenSearch required for nested field filtering at scale
- **Table-per-model**, shared tables with tenant column, locale column
- **System fields as real columns**, user field values as single `values` JSONB column
- **All search/filter/sort via OpenSearch** — Postgres only for point lookups and writes
- **WAL logical replication** for Postgres to OpenSearch sync (separate worker process managed by PM2)
- **Upsert pattern** (`ON CONFLICT DO UPDATE`) for CRUD, `SELECT FOR UPDATE` for flag swaps
- **Single row per revision** — no separate L/P rows (simplified vs DDB pattern)
- **No GIN index** on values JSONB (OpenSearch handles all filtering)
- **Package name:** `@webiny/api-headless-cms-pg-os`
- **Reuse** `api-core-sql` Knex stack and `api-opensearch` package
- **Dynamic zone filtering** not yet in API but data indexed in OpenSearch — enabling requires GraphQL + OS query builder work

## Current state

- Branch: `bruno/feat/api-headless-cms-postgres`
- No code changes — docs only
- 14 commits, 1 unpushed
- No build/test impact

## What might come next

- Implementation planning — break into phases, define package structure
- Phase 1: Package scaffold (`api-headless-cms-pg-os`), table creation, basic CRUD
- Phase 2: WAL worker process, OpenSearch sync
- Phase 3: Entry storage operations (get/create/update/delete/publish)
- Phase 4: List operations (OpenSearch query building, reuse from `api-opensearch`)
- Phase 5: Testing with in-memory Postgres + real OpenSearch
- Phase 6: Model/group storage operations
- Consider: adapting the handoff skill's doc references for Webiny project structure
