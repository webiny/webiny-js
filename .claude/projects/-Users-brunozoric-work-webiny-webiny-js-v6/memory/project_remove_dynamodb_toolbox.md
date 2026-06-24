---
name: project-remove-dynamodb-toolbox
description: COMPLETED — replaced dynamodb-toolbox with DynamoDocClient + EntitySchema in packages/db-dynamodb. Branch bruno/refactor/db-dynamodb-toolbox, commit 404398ad9d
metadata:
  type: project
---

Replaced `dynamodb-toolbox` dependency in `packages/db-dynamodb` with direct AWS SDK v3 calls. **Completed 2026-06-24.**

**Why:** dynamodb-toolbox added indirection without value — `strictSchemaCheck: false` was used everywhere, so it was only adding `_et`/timestamps. Direct SDK calls give full control over marshalling, batch operations, and pagination.

**What was built:**

- `DynamoDocClient` — wraps `DynamoDBDocument` with get/put/delete/query/scan/batchGet/batchWrite (43 unit tests)
- `EntitySchema` — handles marshal/unmarshal/toPutRequest/toDeleteRequest (22 unit tests)
- `DocQueryCommand` added to `@webiny/aws-sdk` — lib-dynamodb QueryCommand (existing one was from client-dynamodb)
- `IEntity` now exposes `schema: EntitySchema` + `client: DynamoDocClient` instead of `entity: BaseEntity`
- `ITable` is no longer generic
- External consumers updated: `api-core-ddb`, `api-elasticsearch-tasks`, `api-file-manager`

**How to apply:** Plan at `docs/.bruno/plans/remove-dynamodb-toolbox/`. All 7 tasks done. 203 tests pass, full build clean. Not yet pushed or PR'd.

Related: [[project_ddb_direct_usage]]
