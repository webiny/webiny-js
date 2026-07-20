# Session Handoff — 2026-07-16 — Utils-OS Extraction + PG Sync Adapter

## What was done

- Designed full PG+OpenSearch storage stack (spec + 3 reviewed plans)
- **Phase 1:** Extracted shared OpenSearch query infrastructure from `api-headless-cms-ddb-es` into new `@webiny/api-headless-cms-utils-os` package (77 files, 12 abstractions, 9 feature directories, query builders, field indexers, filters, sort, FTS)
- **Phase 2:** Built new `@webiny/api-sync-pg-to-opensearch` package — WAL-based sync adapter that receives pre-formatted OS documents from PG sync table and pushes to OpenSearch
- Refactored `api-headless-cms-ddb-es` to depend on `utils-os` — all 110 existing tests pass
- 13 commits, 146 files changed

## Key decisions

- `api-headless-cms-utils-os` holds ALL OpenSearch query infrastructure (field indexing, filtering, sorting, FTS, query/body/sort modifiers, value search, index lifecycle, entry-to-index transformations). Both `ddb-es` and future `pg-os` depend on it.
- PG sync adapter uses self-describing compressed data format (`{compression, value}`) matching DDB adapter pattern — not hardcoded compression type
- `PgWalChangeRecord` type defines the sync table row format: `{id, entryId, index, operation, data: {compression, value}, tenant}`
- PG sync handler is a simple function `(records: PgWalChangeRecord[]) => Promise<void>` — no Lambda/DynamoDBEventHandler abstraction needed
- `CmsIndexEntry` type moved from `ddb-es/types.ts` to `utils-os/types.ts` (OS-relevant, no DDB deps)
- `recordType.ts` (string factories for "cms.entry.l"/"cms.entry.p") copied to utils-os since it's used by the query layer

## Current state

- Branch: `bruno/feat/api-headless-cms-pg-os`, 13 commits ahead of next
- Tests: ddb-es 110/110 pass, pg-sync 6/6 pass
- Build: all 3 packages build green
- Not pushed

## What might come next

- **Phase 3: `api-headless-cms-pg-os`** — the main PG+OS CMS storage package. Needs:
  - SyncTableManager feature (lazy PG table creation for sync records)
  - Entry write ops with dual-write (PG main table + PG sync table)
  - Entry point reads from PG (delegates to `api-headless-cms-sql`)
  - Entry list/search from OpenSearch (uses `utils-os` query infrastructure)
  - Model/group ops passthrough to `api-headless-cms-sql`
  - Composite `HeadlessCmsPgOsFeature`
  - Full test suite with pglite + OpenSearch
- Query builder/sorter extraction from CMS core (`CmsWhereMapper`, `CmsSortMapper`) — mentioned by user as future work
