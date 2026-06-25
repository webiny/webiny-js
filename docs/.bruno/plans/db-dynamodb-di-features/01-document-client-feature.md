# Task 1: Create DynamoDbDocumentClient Feature

**Parallel with:** Tasks 2, 3, 4

**Files:**
- Create: `packages/db-dynamodb/src/features/DynamoDbDocumentClient/abstractions.ts`
- Create: `packages/db-dynamodb/src/features/DynamoDbDocumentClient/DynamoDbDocumentClient.ts`

**Produces:** `IDynamoDbDocumentClient` interface, `DynamoDbDocumentClient` namespace + class, `IQueryParams`, `IQueryPageResponse`, `IScanParams`, `IScanResponse` types

Creates NEW files alongside the existing `utils/DynamoDocClient.ts`. No existing code is modified.

---

- [ ] **Step 1: Create `abstractions.ts`**

Extract all type definitions from `utils/DynamoDocClient.ts` (lines 1-76). The interface must match the public API of the existing `DynamoDocClient` class exactly. No `createAbstraction` call — this is a plain interface + namespace (not DI-resolved, instances created by `DynamoDbTableFactory`).

Key types to include: `IKeyAttributes`, `IQueryParams`, `IQueryPageResponse`, `IScanParams`, `IScanResponse`, `IDynamoDbDocumentClient`, and the `DynamoDbDocumentClient` namespace.

See spec section "Abstraction: DynamoDbDocumentClient" for the full interface.

- [ ] **Step 2: Create `DynamoDbDocumentClient.ts`**

Copy the class from `utils/DynamoDocClient.ts` (~430 lines). Rename class from `DynamoDocClient` to `DynamoDbDocumentClient`. Add `implements IDynamoDbDocumentClient`. Import types from `./abstractions.js` instead of defining inline. All method logic stays identical.

Export an `IDynamoDbDocumentClientParams` interface for the constructor: `{ documentClient: DynamoDBDocument; tableName: string }`.

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/db-dynamodb 2>&1 | tail -5
```

Expected: succeeds (new files are standalone, nothing imports them yet).

- [ ] **Step 4: Commit**

```bash
git add packages/db-dynamodb/src/features/DynamoDbDocumentClient/
git commit -m "feat(db-dynamodb): create DynamoDbDocumentClient feature files"
```
