# Task 4: Create DynamoDbTableFactory Feature

**Parallel with:** Tasks 1, 2, 3

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/DynamoDbTableFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbTableFactory/feature.ts`

**Consumes:** `DynamoDbDocumentClient` class (Task 1), `DynamoDBClient` abstraction from existing `feature/DynamoDBClient/`

**Produces:** `IDynamoDbTableFactory`, `DynamoDbTableFactory` abstraction token, `DynamoDbTableFactoryFeature`

---

- [ ] **Step 1: Create `abstractions.ts`**

Define `IDynamoDbTableFactoryCreateParams` (`{ name: string; indexes?: Record<string, { partitionKey: string; sortKey?: string }> }`) and `IDynamoDbTableFactory` with one method: `create(params) => DynamoDbDocumentClient.Interface`.

Use `createAbstraction` + namespace pattern. See spec section "Abstraction: DynamoDbTableFactory".

The `indexes` param is a no-op in the current implementation — `DynamoDbDocumentClient` resolves index key attributes dynamically at query time. It exists for future use.

- [ ] **Step 2: Create `DynamoDbTableFactory.ts`**

`DynamoDbTableFactoryImpl` class:
- Constructor takes `DynamoDBClient.Interface` (the existing DI abstraction holding the raw `DynamoDBDocument`)
- `create()` returns `new DynamoDbDocumentClient({ documentClient: this.dynamoDBClient.client, tableName: params.name })`

Import `DynamoDBClient` from `~/feature/DynamoDBClient/abstractions.js` (singular `feature/` — will be updated to `~/features/` in Task 5 when folders move).

- [ ] **Step 3: Create `feature.ts`**

Use `createFeature`. Resolves `DynamoDBClient` from container.

```typescript
register(container) {
    const dynamoDBClient = container.resolve(DynamoDBClient);
    container.registerInstance(DynamoDbTableFactory, new DynamoDbTableFactoryImpl(dynamoDBClient));
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbTableFactory/
git commit -m "feat(db-dynamodb): create DynamoDbTableFactory feature files"
```
