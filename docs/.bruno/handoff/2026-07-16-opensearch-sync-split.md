# Session Handoff — 2026-07-16 — OpenSearch Sync Package Split

## What was done

- Split `@webiny/api-dynamodb-to-elasticsearch` (renamed to `@webiny/api-sync-to-opensearch`) into two packages:
  - **`@webiny/api-sync-to-opensearch`** — platform-agnostic base, OpenSearch-only, zero AWS imports. All concerns as DI abstractions: Operations, OperationsFactory, OperationsBuilder, ExecuteSync, ExecuteSyncWithRetry, SynchronizationBuilder.
  - **`@webiny/api-sync-ddb-to-opensearch`** — DynamoDB adapter. DdbOperationsBuilder, DdbToOpenSearchHandler, composite DdbToOpenSearchFeature. Single public export: `createDdbToOpenSearchStreamHandler`.
- Added `Timer` abstraction to `@webiny/utils` — canonical timer for the system (background tasks, sync pipeline, etc.)
- ExecuteSync/ExecuteSyncWithRetry resolve Timer, OpenSearchClient, Env from DI container (not params)
- Replaced `getNumberEnvVariable`/`shouldShowLogs` helpers with `Env` abstraction from `@webiny/stdlib`
- Updated all consumers: `api-elasticsearch-tasks`, `api-headless-cms-ddb-es`, `project-aws-template`, `project-aws`
- Wrote spec and implementation plan
- 20 commits, 15 tests passing (4 base + 11 adapter)

## Key decisions

- **DI conventions established:** abstraction files in `abstractions/` subdirectory (one per file), implementation files named after class (not `implementation.ts`), namespace types only outside abstraction files (`Foo.Interface` not `IFoo`), export name matches abstraction (`Foo` not `FooImplementation`)
- **OperationsFactory pattern:** Operations class instantiated via factory abstraction (not `new Operations()` directly)
- **Composite feature:** DDB adapter's `DdbToOpenSearchFeature` registers all base features internally — consumers import only the adapter package
- **Minimal barrel exports:** Only export what external consumers need (`createDdbToOpenSearchStreamHandler`), not internal DI wiring
- **Timer is canonical:** `@webiny/utils` Timer is the shared abstraction for everything. Background-tasks consolidation is follow-up work
- **Env vars renamed:** `WEBINY_DYNAMODB_TO_OPENSEARCH_*` → `WEBINY_TO_OPENSEARCH_*` (platform-agnostic)

## Current state

- Branch: `bruno/feat/api-sync-to-opensearch`
- Tests: 15 passed (4 base + 11 adapter)
- Build: passing
- Lint/format: clean
- Unpushed commits: 20

## What might come next

- `api-elasticsearch-tasks` test failures — pre-existing DI registration gaps (missing OpenSearchClient, Timer, SynchronizationBuilder registrations in `ElasticsearchTasksFeature`). Need to register base sync features in the host container for `ElasticsearchSynchronize` to work.
- Background-tasks Timer consolidation — `@webiny/background-tasks` has its own `Timer` namespace; should migrate to the canonical `@webiny/utils` Timer
- Handler-aws timer cleanup — old `ITimer` in `handler-aws` can be removed once all consumers migrate
- Future PG adapter — `@webiny/api-sync-pg-to-opensearch` would follow the same pattern as the DDB adapter
- Base package `repository.directory` in package.json still says `api-file-manager` (pre-existing, cosmetic)
