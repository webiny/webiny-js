# Session Handoff — 2026-06-24 — Remove dynamodb-toolbox Planning

## What was done

- Deep codegraph exploration of `packages/db-dynamodb` to map every dynamodb-toolbox API call, wrapper class, and external consumer
- Identified that dynamodb-toolbox is used via only 2 direct imports (`toolbox.ts` + `entity/types.ts`), with 22 internal files and 11 external files consuming through those
- Catalogued exactly 12 dynamodb-toolbox APIs in use: `entity.put/get/delete/query/scan/putBatch/deleteBatch/getBatch`, `entity.schema.attributes`, `table.batchGet/batchWrite/scan`
- Wrote a 7-task implementation plan split across 8 files in `docs/.bruno/plans/remove-dynamodb-toolbox/`
- 1 commit, 0 tests (planning only)

## Key decisions

- **Bottom-up replacement strategy:** New `DynamoDocClient` (AWS SDK wrapper) + `EntitySchema` (marshal/unmarshal) replace dynamodb-toolbox internals, keeping `IEntity`/`ITable` public interfaces stable
- **No consumer code changes needed** for most packages — `toolbox.ts` stays as a type re-export shim, `TableDef` becomes an alias for `DynamoDocClient`
- **Tasks 1 and 2 are independent** and can be parallelized (DynamoDocClient + EntitySchema)
- **`strictSchemaCheck: false` is already used everywhere** — dynamodb-toolbox isn't validating attributes, just adding `_et`/timestamps, so EntitySchema is much simpler
- **Index key mapping is hardcoded** in `DynamoDocClient.buildKeyConditionExpression` matching `createTable.ts` defaults (GSI1 -> GSI1_PK/GSI1_SK, etc.)

## Current state

- Branch: `bruno/refactor/db-dynamodb-toolbox`
- Tests: N/A (planning only, no code changes)
- Build: not affected (only markdown added)
- Unpushed commits: 1

## What might come next

- Execute the 7-task plan using subagent-driven development (recommended) or inline execution
- Tasks 1+2 can run in parallel as first step
- After completion, run full CMS test suite (12 shards) to validate no regressions
- Consider adding integration tests for `DynamoDocClient` against DynamoDB Local
