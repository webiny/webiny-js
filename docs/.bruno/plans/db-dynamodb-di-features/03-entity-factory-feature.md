# Task 3: Create DynamoDbEntityFactory Feature

**Parallel with:** Tasks 1, 2, 4

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/attributes.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/DynamoDbEntityFactory.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbEntityFactory/feature.ts`

**Consumes:** `DynamoDbDocumentClient.Interface` (Task 1), `DynamoDbBatchFactory` (Task 2), `Entity` class from `utils/entity/Entity.ts`

**Produces:** `IDynamoDbEntityFactory`, `DynamoDbEntityFactory` abstraction token, `DynamoDbEntityFactoryFeature`, `standardEntityAttributes`, `globalEntityAttributes`, `IStandardEntityAttributes`, `IGlobalEntityAttributes`

---

- [ ] **Step 1: Create `attributes.ts`**

Copy attribute constants and types from `utils/createEntity.ts`:
- `IGlobalEntityAttributes<T>` type
- `globalEntityAttributes` const
- `IStandardEntityAttributes<T>` type
- `standardEntityAttributes` const

These are verbatim copies. The old file stays until Task 5.

- [ ] **Step 2: Create `abstractions.ts`**

Re-exports everything from `./attributes.js`. Defines 3 param interfaces (`IDynamoDbEntityFactoryCreateParams`, `...StandardParams`, `...GlobalParams`) and `IDynamoDbEntityFactory` with `create()`, `createStandard()`, `createGlobal()` methods.

Use `createAbstraction<IDynamoDbEntityFactory>("Db/DynamoDB/DynamoDbEntityFactory")` + namespace pattern.

See spec section "Abstraction: DynamoDbEntityFactory" for full definitions.

- [ ] **Step 3: Create `DynamoDbEntityFactory.ts`**

`DynamoDbEntityFactoryImpl` class:
- Constructor takes `DynamoDbBatchFactory.Interface`
- `create()` — `new Entity(params, this.batchFactory)`
- `createStandard()` — spreads `standardEntityAttributes` then delegates to `create()`
- `createGlobal()` — spreads `globalEntityAttributes` then delegates to `create()`

Note: `Entity` constructor needs second `batchFactory` param — type errors expected until Task 5.

- [ ] **Step 4: Create `feature.ts`**

Use `createFeature`. Resolves `DynamoDbBatchFactory` from container, passes to `DynamoDbEntityFactoryImpl`.

```typescript
register(container) {
    const batchFactory = container.resolve(DynamoDbBatchFactory);
    container.registerInstance(DynamoDbEntityFactory, new DynamoDbEntityFactoryImpl(batchFactory));
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbEntityFactory/
git commit -m "feat(db-dynamodb): create DynamoDbEntityFactory feature files"
```
