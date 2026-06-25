# Session Handoff — 2026-06-25 — api-core-ddb DI Features

## What was done

- Converted 3 api-core-ddb storage modules (adminUsers, security, keyValueStore) from factory functions to full DI features using `createImplementation` + `createFeature` pattern
- Fixed TYPE/GSI_TENANT-in-keys bug in security storage ops (extra fields in get/delete keys cause DynamoDB schema errors)
- Fixed same bug in api-aco-ddb FLP storage ops
- Made DynamoDbDriver self-contained (creates its own client/factory internally instead of requiring DI params)
- Removed dead aws-sdk usage from db-dynamodb utils (deleted count.ts, cleaned scan.ts re-exports, replaced WriteRequest with local IWriteRequest)
- Wired all 4 features in `createApiCoreDdb()`: tenancy, adminUsers, security, keyValueStore
- Updated core-features-reference.md with new api-core-ddb DI features
- 38 total commits on branch, 203 db-dynamodb tests + 74 api-aco tests passing

## Key decisions

- `DynamoDbDriver` bootstraps its own `DynamoDbDocumentClient`, `DynamoDbBatchFactoryImpl`, and `DynamoDbEntityFactoryImpl` internally — it's a legacy component, not a DI participant
- Primary key helpers (createXKeys) must return only PK + SK. TYPE goes in put calls, GSI keys go in separate GSI helpers
- `createApiCoreDdb()` takes no params — all storage ops are DI-resolved via container
- Unused aws-sdk type re-exports removed; local `IWriteRequest` interface replaces SDK's `WriteRequest`

## Current state

- Branch: `bruno/refactor/db-dynamodb-toolbox`, 38 commits ahead of next (not pushed)
- Build: passing for db-dynamodb, api-core-ddb, api-aco-ddb
- Tests: 203 db-dynamodb + 74 api-aco passing
- api-core-ddb test setup and api-core features updated for new DI wiring
- Tenancy module was your pre-existing refactor; agents added adminUsers, security, keyValueStore alongside it

## What might come next

- Push branch and create PR
- Run full test suite (api-core tests, security tests, tenancy tests) to verify all DI wiring
- Apply same `createImplementation` pattern to remaining consumer packages (api-file-manager, api-websockets-ddb, api-audit-logs-ddb)
- Remove remaining barrel imports from `@webiny/db-dynamodb` root — enforce `exports/api/db.js` path
- Address pre-existing `export default DynamoDbDriver` convention violation
- Update project templates (appTemplates/api/graphql/src/index.ts) to use new `createApiCoreDdb()` signature (no params)
