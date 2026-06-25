# Session Handoff — 2026-06-18 — OpenSearch Testing & DI

## What was done

- Replaced `createOpenSearchContext` (ContextPlugin) with `registerOpensearchCore` (RegisterExtensionPlugin) across all 6 consumer files
- Created `@webiny/api-opensearch/src/testing/` module with:
  - `createTestOpenSearchClient` — plain Client (no AWS Sigv4 auth), with index tracking, auto-cleanup, bulk/search dirty-index refresh
  - `registerOpensearchCoreForTests` — same-package DI registration (eliminates cross-package Symbol mismatch)
  - `setupTestIndexManager` — typed beforeEach/afterEach index cleanup lifecycle hooks
- Updated `api-elasticsearch-tasks` test handler to use `@webiny/api-opensearch/testing` directly instead of `project-utils/testing/elasticsearch`
- Removed `project-utils/testing/elasticsearch/` directory (getElasticsearchClient, client.ts, createClient.js, elasticIndexManager)
- Fixed DI token Symbol mismatch that caused "No registration found for OpenSearch/Client" errors
- Fixed test client creating unwanted AWS Sigv4 auth for localhost connections
- 31 commits, 102 files changed across the full branch

## Key decisions

- `registerOpensearchCore` returns a `RegisterExtensionPlugin` (runs before ContextPlugins in handler lifecycle), replacing the old `createOpenSearchContext` which was a `ContextPlugin`
- All opensearch test utilities must live in `@webiny/api-opensearch/src/testing/` to avoid cross-package Symbol token mismatches — the DI `Abstraction` class uses `Symbol()` which creates unique tokens per module load
- Test opensearch client uses `new Client()` directly from `@opensearch-project/opensearch`, bypassing `createOpenSearchClient` which adds AWS Sigv4 signing inappropriate for local testing
- Packages that need opensearch in tests import directly from `@webiny/api-opensearch/testing`, never through `project-utils`

## Current state

- Branch: `bruno/refactor/api-elasticsearch-tasks-di`
- Tests: `api-elasticsearch-tasks` 5/8 passing (3 data sync failures are pre-existing — need ES indexes from CMS preset which loads DDB-only)
- Tests: `api-opensearch` 60/76 passing (16 failures are pre-existing AWS credential issues for integration tests)
- Build: not verified this session
- Unpushed commits: 31

## What might come next

- Migrate remaining `getElasticsearchClient` consumers (~12 files across 8 packages) to use `@webiny/api-opensearch/testing` directly
- Fix the 3 `api-elasticsearch-tasks` data sync test failures — they need the CMS storage preset to use `ddb-es` instead of `ddb`, or need explicit index creation in the test setup
- Update `api-headless-cms-ddb-es/__tests__/__api__/setupFile.js` to use `createTestOpenSearchClient` + `setupTestIndexManager` from `api-opensearch/testing` instead of the deleted `getElasticsearchClient`
- The `api-headless-cms-ddb-es` tests may be broken now that `project-utils/testing/elasticsearch/` was deleted — needs verification
- CMS storage operations DI migration (user mentioned wanting everything through DI)
