# Session Handoff — 2026-07-21 — Sync Stream Pipeline + Filter Registries DI

## What was done

### 1. Remove PluginsContainer from ddb and ddb-es (1 commit)
- Replaced PluginsContainer threading with DI-resolvable registries in api-headless-cms-ddb and api-headless-cms-ddb-es
- Registered FilterRegistriesFeature in HeadlessCmsDdbFeature
- Resolved 4 registries from container in entry operations (pathRegistry, transformRegistry, filterCreateRegistry, sortingRegistry)
- Deleted dead dynamoDbPlugins, createFilterCreatePlugins, plugin re-exports
- Removed @webiny/plugins dependency from ddb
- Updated 41 ddb tests (datetime transform now correctly active)
- ddb-es: removed dead plugins param (accepted but never consumed)

### 2. PG-to-OpenSearch sync stream pipeline (14 commits)
- Added SyncEvent type to api-headless-cms-pg-os
- Changed SyncWriter remove methods from upsert-REMOVE to DELETE (os_sync = source of truth)
- Created SyncEventHandler (abstraction + implementation + feature) — processes SyncEvent[] batches, decompresses data, feeds SynchronizationBuilder, flushes to OS with configurable batchSize
- Created simulatePgStream test utility — intercepts knex writes via snapshot-diff, produces INSERT/MODIFY/REMOVE events (PG equivalent of DynamoDB Streams simulation)
- Created createReindexEvents utility — reads all os_sync rows as INSERT events
- 6 integration tests: INSERT sync, MODIFY sync, REMOVE sync, batchSize, published+latest, reindex
- Added apiCore storage ops setup for CMS integration tests
- Added pg-os to CMS CI config and root test:pg:os script

## Key decisions

- os_sync table is permanent source of truth (not a transient WAL). Rows deleted when entries removed. Reindex reads all rows.
- Production sync will use PG logical replication (future). Tests use simulatePgStream which monkey-patches knex.client.query.
- SyncEvent.type reflects SQL operation (INSERT/MODIFY/REMOVE), not ISyncRow.operation (always MODIFY for existing rows)
- INSERT and MODIFY are functionally identical for the handler (both decompress + index). Distinction exists for observability.
- simulatePgStream uses snapshot-diff: captures all rows before/after each knex operation, diffs by id + data comparison. Robust but O(n) per write.
- Pool max 2 required for PGlite tests (simulatePgStream nested queries deadlock with pool 1)

## Current state

- Branch: bruno/feat/api-postgres-to-os, 16 commits ahead of last push
- Tests: 41 ddb + 15 storage pass. 9 pg-os pass (6 sync stream tests need real OS).
- Build: passing for all modified packages
- Lint/format: clean
- Known issue: CMS integration tests with WEBINY_STORAGE=pg-os fail with `knex.client is not a function` — pre-existing, first time running full CMS tests against pg-os backend

## What might come next

1. **Debug pg-os CMS integration tests** — `knex.client is not a function` error when running api-headless-cms tests with pg-os storage. Likely DI wiring issue.
2. **Run sync stream tests against real OS** — verify 6 integration tests pass with OpenSearch running
3. **Production PG logical replication consumer** — reads replication slot, produces SyncEvent[], feeds SyncEventHandler
4. **Background reindex task** — orchestrates full reindex from os_sync when OS indexes are lost
5. **Push branch and create PR** for all work on bruno/feat/api-postgres-to-os
