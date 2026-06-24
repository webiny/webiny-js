# Session Handoff — 2026-06-24 — Remove dynamodb-toolbox

## What was done

- Replaced `dynamodb-toolbox` library with two new primitives in `packages/db-dynamodb`:
  - `DynamoDocClient` — low-level AWS SDK v3 DynamoDBDocument wrapper (get/put/delete/query/scan/batchGet/batchWrite)
  - `EntitySchema` — attribute marshalling/unmarshalling (marshal, unmarshal, toPutRequest, toDeleteRequest)
- Rewired all internal utils (put, get, delete, query, scan, cleanup, count) and classes (Entity, Table, batch builders) to use DynamoDocClient + EntitySchema
- Updated external consumers in `api-core-ddb`, `api-elasticsearch-tasks`, `api-file-manager`
- Added `DocQueryCommand` to `@webiny/aws-sdk` — the lib-dynamodb QueryCommand (existing export was from client-dynamodb, used for raw DDB format)
- Removed `dynamodb-toolbox` from package.json dependencies
- 3 commits, 203 tests pass (including 43 DynamoDocClient + 22 EntitySchema unit tests)

## Key decisions

- `QueryCommand` from `@aws-sdk/client-dynamodb` (raw format) kept for existing consumers; added `DocQueryCommand` from `@aws-sdk/lib-dynamodb` for document client queries
- `IEntity` interface changed: now exposes `schema: EntitySchema` + `client: DynamoDocClient` instead of `entity: BaseEntity`
- `ITable` is no longer generic (was `ITable<Name, PK, SK>`)
- `ScanParams` kept `table` field name (not `client`) for external API stability
- `batchReadAll` changed field from `table` to `client` (fewer external consumers)
- `EntitySchema.unmarshal` matches existing `cleanupItem` behavior exactly — strips TYPE and all infrastructure keys

## Current state

- Branch: `bruno/refactor/db-dynamodb-toolbox`
- Tests: 203 passed (db-dynamodb package)
- Build: passing (all 126 packages)
- Unpushed commits: 3

## What might come next

- Push branch and create PR against `next`
- Run full CMS test suite (12 shards) to validate no regressions across the monorepo
- Consider integration tests for DynamoDocClient against DynamoDB Local
- The two lint warnings in DynamoDocClient.test.ts (unused `command` params in mock callbacks) could be fixed by prefixing with `_`
