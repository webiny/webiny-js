# Session Handoff — 2026-07-24 — Search Index Tasks Extraction

## What was done

- Extracted search index tasks from `@webiny/api-elasticsearch-tasks` into three new platform-agnostic packages:
  - `@webiny/api-search-index-tasks` — task definitions, runners, abstractions (StorageScanner, IndexManager, StorageWriter, IndexManagerFactory, IndexSettingsManager, TenantIndexFactory), settings (DisableIndexing, EnableIndexing)
  - `@webiny/api-search-index-tasks-os` — OpenSearch implementations (OsIndexManager, IndexManagerFactory, IndexSettingsManager)
  - `@webiny/api-search-index-tasks-ddb-os` — DynamoDB implementations (DdbStorageScanner, DdbStorageWriter), composes OS feature
- Deleted 4 packages: `api-elasticsearch-tasks`, `api-background-tasks-os`, `api-background-tasks-ddb`, `api-headless-cms-tasks-ddb-es`
- Changed reindex behavior: creates missing indexes with proper settings from TenantIndexFactory instead of skipping
- Fixed SQL storage `create` returning internal `isLatest`/`isPublished` columns
- 35 commits, 12 tests (9 ReindexRunner + 3 OsIndexManager)

## Key decisions

- Task IDs preserved (`elasticsearchReindexing`, `elasticsearchCreateIndexes`, `elasticsearchEnableIndexing`) for DB backward compat
- Opaque `cursor: string` instead of DDB-specific `{PK, SK}` keys for scanner pagination
- `TenantIndexFactory` uses DI key `"OpenSearchTenantIndexFactory"` to match existing consumer registrations
- Three-tier package hierarchy: core (platform-agnostic) → OS (OpenSearch-specific) → DDB-OS (DDB + composes OS)
- DisableIndexing/EnableIndexing are engine-agnostic logic — live in core, not bridge
- ReindexRunner owns index config resolution (via TenantIndexFactory), not ReindexTask
- `dataSynchronization` task deliberately dropped — can be rebuilt if needed
- Bridge packages export only their feature from barrel — consumers use core abstractions

## Current state

- Branch: `bruno/feat/api-search-index-tasks/convert`
- Tests: 12 passing (9 ReindexRunner unit, 3 OsIndexManager unit)
- CMS SQL tests shard 2/6: 135/135 passing
- Build: all three new packages build clean
- Unpushed commits: 35
- Not pushed

## What might come next

- Push branch and create PR
- Add tests for EnableIndexingRunner and CreateIndexesRunner
- Production PG logical replication consumer (uses same StorageScanner abstraction)
- `api-search-index-tasks-pg-os` bridge when PG-OS storage arrives (composes same OS feature)
- Background reindex task integration with CMS
- Run sync stream tests against real OpenSearch
