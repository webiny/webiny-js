# Task 6: Migrate `webiny` + `api-core-ddb`

**Depends on:** Task 5  
**Parallel with:** Tasks 7, 8, 9, 10

## Part A: `webiny` package

**Files:**
- Modify: `packages/webiny/src/api/db.ts`

Change `feature/` → `features/` in all three `@webiny/db-dynamodb` import paths:
- `@webiny/db-dynamodb/feature/DynamoDBClient/index.js` → `@webiny/db-dynamodb/features/DynamoDBClient/index.js`
- `@webiny/db-dynamodb/feature/ValueFilter/index.js` → `@webiny/db-dynamodb/features/ValueFilter/index.js`
- `@webiny/db-dynamodb/feature/FilterUtil/index.js` → `@webiny/db-dynamodb/features/FilterUtil/index.js`

## Part B: `api-core-ddb`

**Files:**
- Modify: `packages/api-core-ddb/src/tenancy/index.ts`
- Modify: `packages/api-core-ddb/src/tenancy/definitions/tenantEntity.ts`
- Modify: `packages/api-core-ddb/src/security/index.ts`
- Modify: `packages/api-core-ddb/src/security/definitions/entities.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/index.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/definitions/entities.ts`
- Modify: `packages/api-core-ddb/src/adminUsers/types.ts`
- Modify: `packages/api-core-ddb/src/keyValueStore/KeyValueStoreDynamoTable.ts`

**Pattern:** In each file:
1. Replace `import { createTable, createStandardEntity } from "@webiny/db-dynamodb"` with `import { DynamoDbTableFactory, DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js"`
2. Replace `import type { TableDef } from "@webiny/db-dynamodb/toolbox.js"` with `import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js"`
3. Replace `createTable({ name, documentClient })` with `tableFactory.create({ name })`
4. Replace `createStandardEntity({ table, name })` with `entityFactory.createStandard({ client, name })`
5. Change constructor DI dependencies from `DynamoDBClient` to `DynamoDbTableFactory` + `DynamoDbEntityFactory`
6. Change `getTable(): ITable` return type to `DynamoDbDocumentClient.Interface`

---

- [ ] **Step 1: Update entity definitions**

`tenantEntity.ts`, `security/entities.ts`, `adminUsers/entities.ts` — change param from `TableDef` to `DynamoDbDocumentClient.Interface` + `DynamoDbEntityFactory.Interface`, use `entityFactory.createStandard()`.

- [ ] **Step 2: Update index files**

`tenancy/index.ts`, `security/index.ts`, `adminUsers/index.ts` — replace `createTable()` with `tableFactory.create()`, update DI dependencies.

- [ ] **Step 3: Update `adminUsers/types.ts`**

Change `getTable(): ITable` to return `DynamoDbDocumentClient.Interface`.

- [ ] **Step 4: Update `keyValueStore/KeyValueStoreDynamoTable.ts`**

Replace `createTable` + `createGlobalEntity` with factory calls.

- [ ] **Step 5: Build and test**

```bash
yarn build -p @webiny/webiny -p @webiny/api-core-ddb 2>&1 | tail -10
yarn test packages/api-core-ddb 2>&1 | tail -30
```

- [ ] **Step 6: Run before-commit checklist and commit**

```bash
git add packages/webiny/ packages/api-core-ddb/
git commit -m "refactor(webiny, api-core-ddb): migrate to DI factory abstractions"
```
