# Task 9: Migrate `api-opensearch` + `api-elasticsearch-tasks`

**Depends on:** Task 5  
**Parallel with:** Tasks 6, 7, 8, 10

## Part A: `api-opensearch`

**Files:**
- Modify: `packages/api-opensearch/src/db/table.ts`
- Modify: `packages/api-opensearch/src/db/entity.ts`

- `table.ts` — replace `createTable` with `DynamoDbTableFactory.create()`, change return type from `ITable` to `DynamoDbDocumentClient.Interface`
- `entity.ts` — replace `createStandardEntity` with `DynamoDbEntityFactory.createStandard()`, change `ITable` param type, update `standardEntityAttributes` import to `@webiny/db-dynamodb/exports/api/db.js`

## Part B: `api-elasticsearch-tasks`

**Files:**
- Modify: `packages/api-elasticsearch-tasks/src/tasks/Manager.ts`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/reindexing/ReindexingTaskRunner.ts`
- Modify: `packages/api-elasticsearch-tasks/src/helpers/scan.ts`

Special cases:
- `ElasticsearchSynchronize.ts` imports `Entity` class directly — switch to resolving entities from `DynamoDbEntityFactory` or through `DbRegistry`
- `Manager.ts` calls `createOpenSearchTable`/`createOpenSearchEntity` — update to use factory pattern
- `scan.ts` uses `TableDef` type — update to `DynamoDbDocumentClient.Interface` from `@webiny/db-dynamodb/exports/api/db.js`

---

- [ ] **Step 1: Update `api-opensearch` files**

- [ ] **Step 2: Update `api-elasticsearch-tasks` files**

- [ ] **Step 3: Build and test**

```bash
yarn build -p @webiny/api-opensearch -p @webiny/api-elasticsearch-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Run before-commit checklist and commit**

```bash
git add packages/api-opensearch/ packages/api-elasticsearch-tasks/
git commit -m "refactor(api-opensearch, api-elasticsearch-tasks): migrate to DI factory abstractions"
```
