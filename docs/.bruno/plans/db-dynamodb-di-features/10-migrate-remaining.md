# Task 10: Migrate Remaining Consumers

**Depends on:** Task 5  
**Parallel with:** Tasks 6, 7, 8, 9

## Part A: `api-aco-ddb`

**Files:**
- Modify: `packages/api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts`

Replace `createTable` + `createStandardEntity` with `DynamoDbTableFactory.create()` + `DynamoDbEntityFactory.createStandard()`. Update constructor DI dependencies.

## Part B: `api-audit-logs-ddb`

**Files:**
- Modify: `packages/api-audit-logs-ddb/src/entity.ts`
- Modify: `packages/api-audit-logs-ddb/src/Storage.ts`

Special cases:
- Uses `ReturnType<typeof createTable>` as a type — replace with `DynamoDbDocumentClient.Interface`
- Uses dynamic GSI count (`gsiAmount`) — use `tableFactory.create({ name, indexes: createTableGSIIndexes(gsiAmount) })`
- `createEntity` function signature changes: takes `tableFactory`/`entityFactory` instead of raw `documentClient`

## Part C: `api-websockets-ddb`

**Files:**
- Modify: `packages/api-websockets-ddb/src/entity.ts`
- Modify: `packages/api-websockets-ddb/src/WebsocketsConnectionRegistry.ts`

Replace `createTable` + `createStandardEntity` with factory calls. Update `createEntity()` function and its call site in `WebsocketsConnectionRegistry`.

## Part D: `api-file-manager` (test utils only)

**Files:**
- Modify: `packages/api-file-manager/__tests__/utils/scanTable.ts`

- Update `import type { TableDef } from "@webiny/db-dynamodb/toolbox.js"` — this still works (re-exported as alias)
- Update `import type { IScanParams } from "@webiny/db-dynamodb/utils/DynamoDocClient.js"` — this path is deleted, change to `import type { IScanParams } from "@webiny/db-dynamodb/exports/api/db.js"`

---

- [ ] **Step 1: Update `api-aco-ddb`**

- [ ] **Step 2: Update `api-audit-logs-ddb`**

- [ ] **Step 3: Update `api-websockets-ddb`**

- [ ] **Step 4: Update `api-file-manager` test utils**

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/api-aco-ddb -p @webiny/api-audit-logs-ddb -p @webiny/api-websockets-ddb 2>&1 | tail -10
```

- [ ] **Step 6: Run before-commit checklist and commit**

```bash
git add packages/api-aco-ddb/ packages/api-audit-logs-ddb/ packages/api-websockets-ddb/ packages/api-file-manager/
git commit -m "refactor: migrate remaining consumers to DI factory abstractions"
```
