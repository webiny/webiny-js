# Task 6: Update external consumers and remove `dynamodb-toolbox`

**Files:**
- Modify: `packages/db-dynamodb/src/DynamoDbDriver.ts`
- Modify: `packages/db-dynamodb/src/store/entity.ts`
- Modify: `packages/db-dynamodb/src/plugins/definitions/FieldPlugin.ts`
- Modify: External files importing from `@webiny/db-dynamodb/toolbox.js` (11 files):
  - `packages/api-file-manager/__tests__/utils/scanTable.ts`
  - `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`
  - `packages/api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts`
  - `packages/api-elasticsearch-tasks/src/helpers/scan.ts`
  - `packages/api-core-ddb/src/security/definitions/entities.ts`
  - `packages/api-core-ddb/src/tenancy/definitions/tenantEntity.ts`
  - `packages/api-core-ddb/src/adminUsers/definitions/entities.ts`
- Modify: `packages/db-dynamodb/package.json` — remove `dynamodb-toolbox` dependency

**Interfaces:**
- Consumes: Everything from Tasks 1-5
- Produces: Working build with zero dynamodb-toolbox references. The `toolbox.ts` file can be deleted or kept as a pure type re-export file.

---

- [ ] **Step 1: Update `DynamoDbDriver.ts`**

The driver creates a table and entity. Now it uses `createTable` (returns `ITable` with `.table` as `DynamoDocClient`) and `createEntity` (takes `DynamoDocClient` as table). The `.entity` property type changes from dynamodb-toolbox Entity to our `Entity`. All method calls (`entity.put`, `entity.get`, etc.) already go through our `Entity` class, so no changes to the method bodies.

- [ ] **Step 2: Update `store/entity.ts`**

Currently passes `table.table` (was dynamodb-toolbox Table, now `DynamoDocClient`). Since `createGlobalEntity` expects `table: DynamoDocClient`, this works as-is.

- [ ] **Step 3: Update `FieldPlugin.ts`**

Only imports `DynamoDBTypes` from `~/toolbox.js`. This type is now re-exported from `EntitySchema.ts` through `toolbox.ts`, so no change needed.

- [ ] **Step 4: Update external `toolbox.js` consumers**

These files import `TableDef`, `Table`, `EntityQueryOptions`, or `ScanOptions` from `@webiny/db-dynamodb/toolbox.js`. Since `toolbox.ts` still exports these types (now pointing to our own implementations), most imports work as-is. The type shape of `TableDef` changed from dynamodb-toolbox's `Table` to `DynamoDocClient` — update any code that calls `.batchGet()`, `.batchWrite()`, `.scan()` on a `TableDef` directly.

Specifically `ElasticsearchSynchronize.ts` calls `entity.item.entity.getBatch(...)` — this needs to change to use the new `EntitySchema.toGetKeys(...)` pattern. And it calls `batchReadAll({ items, table })` — this needs to change to `batchReadAll({ keys, client })`.

- [ ] **Step 5: Remove `dynamodb-toolbox` from `package.json`**

```bash
cd packages/db-dynamodb && yarn remove dynamodb-toolbox
```

- [ ] **Step 6: Clean up `toolbox.ts`**

Either delete it (and update all `~/toolbox.js` imports to point to `EntitySchema.ts` / `DynamoDocClient.ts` directly) or keep it as a thin re-export file. Keeping it reduces churn.

- [ ] **Step 7: Full build**

Run: `yarn build 2>&1 | tail -50`
Fix all errors across the monorepo.

- [ ] **Step 8: Run tests for `db-dynamodb` package**

Run: `yarn test packages/db-dynamodb 2>&1 | tail -50`
Expected: All tests pass.

- [ ] **Step 9: Run tests for key consumer packages**

Run these sequentially (not in parallel):

```bash
yarn test packages/api-core-ddb 2>&1 | tail -50
yarn test packages/api-headless-cms-ddb 2>&1 | tail -50
yarn test packages/api-headless-cms-ddb-es 2>&1 | tail -50
```

Expected: All tests pass.

- [ ] **Step 10: Run before-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "refactor(db-dynamodb): remove dynamodb-toolbox dependency"
```
