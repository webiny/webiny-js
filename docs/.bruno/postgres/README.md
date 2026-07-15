# Postgres Storage Operations Research

Research and design documentation for adding Postgres + OpenSearch storage operations to Webiny Headless CMS.

## Documents

| Doc | Description |
|-----|-------------|
| [01-pure-postgres.md](01-pure-postgres.md) | Pure Postgres approach — evaluated and **rejected**. Table-per-model with per-field columns, JSONB expression indexes, tsvector search. Documents why it fails at scale with dynamic/nested fields. Retained as reference. |
| [02-postgres-plus-opensearch.md](02-postgres-plus-opensearch.md) | **Recommended architecture.** Postgres as source of truth + OpenSearch for all search/filter/sort. WAL logical replication for sync. Covers table structure, sync mechanisms, schema lifecycle, re-indexing. |
| [03-cms-comparison.md](03-cms-comparison.md) | Industry comparison of 10 CMS systems (Strapi, Payload, Contentful, TYPO3, WordPress, AEM, Sanity, Directus, Drupal, Sitecore). Storage patterns, nested field filtering via API, AND/OR boolean logic, zero-config filtering, scaling limits. |
| [04-decisions.md](04-decisions.md) | All architectural decisions finalized. Table structure mirroring CmsEntry, JSONB values column, WAL sync, upsert pattern, versioning, transaction boundaries, re-index strategy, JSONB query analysis with benchmarks. |

## Key Decisions

- Postgres + OpenSearch (not pure Postgres)
- Table-per-model, shared tables with tenant column
- System fields as real columns, user field values as single `values` JSONB column
- All search/filter/sort via OpenSearch — Postgres only for point lookups and writes
- WAL logical replication for Postgres to OpenSearch sync (separate worker process)
- Package name: `@webiny/api-headless-cms-pg-os`
