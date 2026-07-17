# Session Handoff — 2026-07-17 — api-headless-cms-pg-os Package

## What was done

- Built new `@webiny/api-headless-cms-pg-os` package — PG+OpenSearch CMS storage adapter
- 6 commits, 17 new files, ~1400 lines of source code
- **SyncTableManager** — lazy PG sync table creation following EntryTableManager pattern (DI abstraction + implementation + feature)
- **SyncWriter** — transforms CMS entries to compressed OS-ready documents, writes to PG sync table using upsert pattern. Self-describing `{compression, value}` format matching the PG-to-OS sync adapter
- **Entry operations** (482 lines) — wraps `@webiny/api-headless-cms-sql` for PG writes, adds sync table dual-write after each mutation, replaces list/search with OpenSearch queries via `@webiny/api-headless-cms-utils-os`
- **Composite feature** — `HeadlessCmsPgOsFeature` registers SQL table managers, OS field indexing/filtering/search features, model event handlers for OS index lifecycle, and the `StorageOperationsFactory` DI binding
- **Test infrastructure** — PGlite + OpenSearch sync bridge pattern, setupFile.js with `setStorageOps`, 9 unit tests passing (SyncTableManager 3 + SyncWriter 6)
- **Model/group operations** — pure passthrough to `@webiny/api-headless-cms-sql`

## Key decisions

- pg-os wraps SQL ops (decorator pattern) rather than reimplementing — avoids duplicating PG write logic
- Sync table uses upsert (`INSERT ... ON CONFLICT ... MERGE`) so each entry has at most one L record and one P record
- No read-modify-write for sync: always prepare fresh OS document from entry data (simpler than ddb-es which decompresses/patches old ES data)
- No DataLoaders needed — PG point reads are already efficient without batching
- No DDB key transforms — PG stores entries in original format
- `OperationType.MODIFY` used for all writes (INSERT and MODIFY are identical in the sync adapter — both upsert)
- For move/moveToBin/restoreFromBin: re-read latest+published from PG after SQL op completes, then write fresh sync records
- Full CMS integration tests deferred — requires OpenSearch in test environment + `WEBINY_STORAGE=pg-os,ddb` CI config

## Current state

- Branch: `bruno/feat/api-headless-cms-pg-os`, 20 commits ahead of next (not pushed)
- Tests: pg-os 9/9 pass, build green, lint clean
- All 3 Phase packages build: utils-os, sync-pg-to-opensearch, pg-os
- ddb-es 110/110 tests still pass (verified in Phase 1)

## What might come next

- **Full CMS integration tests** — run shared CMS test suite with `WEBINY_STORAGE=pg-os,ddb` against real OpenSearch. Needs CI pipeline config + potentially an afterWrite sync hook for test timing
- **Push branch and open PR** — 20 commits ahead, all 3 packages ready for review
- **Query builder/sorter extraction** from CMS core (`CmsWhereMapper`, `CmsSortMapper`) — mentioned as future work
- **Consumer updates** — project templates and deployment configs for PG+OS variant
- **WAL listener infrastructure** — deployment/infra concern for connecting PG WAL to the sync adapter
