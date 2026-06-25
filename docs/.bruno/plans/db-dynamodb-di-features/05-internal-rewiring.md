# Task 5: Internal Rewiring

**Depends on:** Tasks 1-4 (all feature files must exist)

Atomic switch for `packages/db-dynamodb`. All changes happen together.

## Files to modify

**Entity + types:**
- `utils/entity/Entity.ts` — add `batchFactory` param, add `createTableReader()`, change `DynamoDocClient` → `DynamoDbDocumentClient.Interface`
- `utils/entity/types.ts` — change `IEntity.client` type, add `createTableReader(): ITableReadBatch`
- `utils/entity/EntityWriteBatch.ts` — change `client` param type in `IEntityWriteBatchParams`
- `utils/entity/EntityReadBatch.ts` — change `client` param type in `IEntityReadBatchParams`
- `utils/entity/index.ts` — remove `getEntity` re-export

**Table:**
- `utils/table/TableWriteBatch.ts` — change `table` param type in `ITableWriteBatchParams`
- `utils/table/TableReadBatch.ts` — change `table` param type in `ITableReadBatchParams`
- `utils/table/types.ts` — remove `ITable` interface, keep `ITableWriteBatch`, `ITableReadBatch`, update imports
- `utils/table/index.ts` — remove `Table` re-export

**Utils:**
- `utils/put.ts`, `get.ts`, `delete.ts`, `query.ts`, `scan.ts`, `cleanup.ts`, `count.ts` — change `client`/`table` param types
- `utils/batch/batchWrite.ts`, `utils/batch/batchRead.ts` — change `table`/`client` param types
- `utils/index.ts` — remove `createEntity.ts`, `createTable.ts` re-exports

**Other:**
- `store/entity.ts` — switch from `ITable`/`createGlobalEntity` to `DynamoDbDocumentClient.Interface`/`DynamoDbEntityFactory.Interface`
- `toolbox.ts` — `TableDef` → alias for `IDynamoDbDocumentClient`, `EntityConstructor.table` → `DynamoDbDocumentClient.Interface`, remove `TableConstructor`
- `index.ts` — add new feature registrations, update import paths
- `exports/api/db.ts` — add all new abstraction exports

## Files to move

- `feature/DynamoDBClient/` → `features/DynamoDBClient/`
- `feature/FilterUtil/` → `features/FilterUtil/`
- `feature/ValueFilter/` → `features/ValueFilter/`

Then update all imports within moved files and in Task 4's `DynamoDbTableFactory` files from `~/feature/` → `~/features/`.

## Files to delete

- `utils/DynamoDocClient.ts` (replaced by `features/DynamoDbDocumentClient/DynamoDbDocumentClient.ts`)
- `utils/createTable.ts` (replaced by `DynamoDbTableFactory`)
- `utils/createEntity.ts` (replaced by `DynamoDbEntityFactory` + `attributes.ts`)
- `utils/entity/getEntity.ts` (consumers use `IEntity` directly)
- `utils/table/Table.ts` (replaced by `DynamoDbDocumentClient` + `DynamoDbBatchFactory`)

---

- [ ] **Step 1: Move `feature/` → `features/`**

```bash
git mv packages/db-dynamodb/src/feature/DynamoDBClient packages/db-dynamodb/src/features/DynamoDBClient
git mv packages/db-dynamodb/src/feature/FilterUtil packages/db-dynamodb/src/features/FilterUtil
git mv packages/db-dynamodb/src/feature/ValueFilter packages/db-dynamodb/src/features/ValueFilter
rmdir packages/db-dynamodb/src/feature
```

Update all `~/feature/` → `~/features/` imports in moved files and in Task 4's DynamoDbTableFactory files.

- [ ] **Step 2: Update all internal utils — replace `DynamoDocClient` type references**

In every util file: change `import type { DynamoDocClient } from "~/utils/DynamoDocClient.js"` to `import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js"`. Change property/param types from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`.

Also update `IScanParams`/`IScanResponse` imports in `utils/table/types.ts` and `utils/scan.ts` from `~/utils/DynamoDocClient.js` to `~/features/DynamoDbDocumentClient/abstractions.js`.

- [ ] **Step 3: Update `utils/table/types.ts` — remove `ITable`**

Delete the `ITable` interface and the `DynamoDocClient` import. Keep `ITableWriteBatch`, `ITableReadBatch`, `ITableReadBatchKey`, `ITableReadBatchBuilderGetResponse`, `ITableScanParams`, `ITableScanResponse`.

- [ ] **Step 4: Update `utils/entity/types.ts`**

Change `IEntity.client` from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`. Add `createTableReader(): ITableReadBatch` to the `IEntity` interface. Add `ITableReadBatch` to imports from `~/utils/table/types.js`.

- [ ] **Step 5: Update `utils/entity/Entity.ts`**

Add `DynamoDbBatchFactory.Interface` as second constructor param. Replace direct `createEntityWriteBatch`/`createEntityReadBatch`/`createTableWriteBatch` calls with `this.batchFactory.createEntityWriter()`/etc. Add `createTableReader()` method. See spec "Entity Class Update" section.

- [ ] **Step 6: Update `toolbox.ts`**

- `TableDef` → alias for `IDynamoDbDocumentClient`
- `EntityConstructor.table` → `DynamoDbDocumentClient.Interface`
- Remove `TableConstructor` interface (only used by deleted `Table`/`createTable`)

- [ ] **Step 7: Update `store/entity.ts`**

Change params from `{ table: ITable }` to `{ client: DynamoDbDocumentClient.Interface; entityFactory: DynamoDbEntityFactory.Interface }`. Update `DynamoDbDriver.ts` call site accordingly.

- [ ] **Step 8: Update `utils/index.ts`, `utils/entity/index.ts`, `utils/table/index.ts`**

Remove re-exports of deleted files (`createEntity.ts`, `createTable.ts`, `getEntity.ts`, `Table.ts`).

- [ ] **Step 9: Update `index.ts` — add new feature registrations**

Registration order matters:
1. `DynamoDBClientFeature` (no deps)
2. `DynamoDbBatchFactoryFeature` (no deps)
3. `DynamoDbEntityFactoryFeature` (resolves batch factory)
4. `DynamoDbTableFactoryFeature` (resolves DynamoDBClient)
5. `FilterUtilFeature`, `ValueFilterFeature`

Update `DynamoDBClient` export path from `~/feature/` to `~/features/`.

- [ ] **Step 10: Update `exports/api/db.ts`**

Add exports for all new abstractions + types. See spec "Feature Registration" section for the full export block.

- [ ] **Step 11: Delete old files**

```bash
rm packages/db-dynamodb/src/utils/DynamoDocClient.ts
rm packages/db-dynamodb/src/utils/createTable.ts
rm packages/db-dynamodb/src/utils/createEntity.ts
rm packages/db-dynamodb/src/utils/entity/getEntity.ts
rm packages/db-dynamodb/src/utils/table/Table.ts
```

- [ ] **Step 12: Run tests**

```bash
yarn test packages/db-dynamodb 2>&1 | tail -30
```

Expected: all 203 tests pass. Some tests may need import path updates if they import from deleted files.

- [ ] **Step 13: Run before-commit checklist and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "refactor(db-dynamodb): wire DI features, delete old utils"
```
