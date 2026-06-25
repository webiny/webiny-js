# Task 2: Create DynamoDbBatchFactory Feature

**Parallel with:** Tasks 1, 3, 4

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/DynamoDbBatchFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbBatchFactory/feature.ts`

**Consumes:** `DynamoDbDocumentClient.Interface` (Task 1), `EntitySchema` from `utils/EntitySchema.ts`, batch types from `utils/batch/types.ts`, `utils/entity/types.ts`

**Produces:** `IDynamoDbBatchFactory`, `DynamoDbBatchFactory` abstraction token, `DynamoDbBatchFactoryFeature`

---

- [ ] **Step 1: Create `abstractions.ts`**

Define 4 param interfaces and the `IDynamoDbBatchFactory` interface with 4 factory methods: `createEntityWriter`, `createEntityReader`, `createTableWriter`, `createTableReader`.

Use `createAbstraction<IDynamoDbBatchFactory>("Db/DynamoDB/DynamoDbBatchFactory")` + namespace pattern.

See spec section "Abstraction: DynamoDbBatchFactory" for full interface definitions including all param types.

Key imports:
- `DynamoDbDocumentClient` from `~/features/DynamoDbDocumentClient/abstractions.js`
- `EntitySchema` from `~/utils/EntitySchema.js`
- `IPutBatchItem`, `IDeleteBatchItem`, `IReadBatchItem` from `~/utils/batch/types.js`
- `IEntityWriteBatch`, `IEntityReadBatch` from `~/utils/entity/types.js`
- `ITableWriteBatch`, `ITableReadBatch` from `~/utils/table/types.js`

- [ ] **Step 2: Create `DynamoDbBatchFactory.ts`**

`DynamoDbBatchFactoryImpl` class — delegates to existing factory functions:
- `createEntityWriter` → `createEntityWriteBatch()` from `~/utils/entity/EntityWriteBatch.js`
- `createEntityReader` → `createEntityReadBatch()` from `~/utils/entity/EntityReadBatch.js`
- `createTableWriter` → `createTableWriteBatch()` from `~/utils/table/TableWriteBatch.js`
- `createTableReader` → `createTableReadBatch()` from `~/utils/table/TableReadBatch.js`

Note: type errors expected until Task 5 updates batch param types from `DynamoDocClient` to `DynamoDbDocumentClient.Interface`.

- [ ] **Step 3: Create `feature.ts`**

Use `createFeature` (not `createImplementation`). No DI dependencies — just `container.registerInstance(DynamoDbBatchFactory, new DynamoDbBatchFactoryImpl())`.

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbBatchFactory/
git commit -m "feat(db-dynamodb): create DynamoDbBatchFactory feature files"
```
