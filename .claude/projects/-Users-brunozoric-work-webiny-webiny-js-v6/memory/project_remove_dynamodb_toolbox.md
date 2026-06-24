---
name: project-remove-dynamodb-toolbox
description: Plan to replace dynamodb-toolbox with direct AWS SDK v3 calls in packages/db-dynamodb — 7-task bottom-up plan, branch bruno/refactor/db-dynamodb-toolbox
metadata:
  type: project
---

Replacing `dynamodb-toolbox` dependency in `packages/db-dynamodb` with direct AWS SDK v3 `DynamoDBDocumentClient` calls.

**Why:** dynamodb-toolbox adds indirection without value — `strictSchemaCheck: false` is used everywhere, so it's only adding `_et`/timestamps. Direct SDK calls give full control over marshalling, batch operations, and pagination.

**How to apply:** 7-task plan in `docs/.bruno/plans/remove-dynamodb-toolbox/`. Tasks 1+2 are independent (can parallel). Branch: `bruno/refactor/db-dynamodb-toolbox`. Key insight: only 2 files directly import dynamodb-toolbox (`toolbox.ts` + `entity/types.ts`); 22 internal + 11 external files consume through those. Public `IEntity`/`ITable` interfaces stay stable.

Related: [[project_ddb_direct_usage]]
