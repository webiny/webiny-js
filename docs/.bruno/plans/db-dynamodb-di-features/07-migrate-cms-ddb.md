# Task 7: Migrate `api-headless-cms-ddb`

**Depends on:** Task 5  
**Parallel with:** Tasks 6, 8, 9, 10

**Files:**
- Modify: `packages/api-headless-cms-ddb/src/definitions/entry.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/group.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/model.ts`
- Modify: `packages/api-headless-cms-ddb/src/definitions/table.ts`
- Modify: `packages/api-headless-cms-ddb/src/types.ts`
- Modify: `packages/api-headless-cms-ddb/src/index.ts`

**Pattern:** Same as Task 6 Part B:
1. Replace `createTable`/`createStandardEntity` with factory calls
2. Replace `ITable` return types with `DynamoDbDocumentClient.Interface`
3. Update DI constructor dependencies

---

- [ ] **Step 1: Update `definitions/table.ts`**

Replace `createTable({ documentClient, name })` with `tableFactory.create({ name })`.

- [ ] **Step 2: Update entity definitions**

`definitions/entry.ts`, `group.ts`, `model.ts` — replace `createStandardEntity` with `entityFactory.createStandard()`.

- [ ] **Step 3: Update `types.ts`**

Change `getTable: () => ITable` to `getTable: () => DynamoDbDocumentClient.Interface`.

- [ ] **Step 4: Update `index.ts`**

Update DI dependencies to resolve `DynamoDbTableFactory` + `DynamoDbEntityFactory`.

- [ ] **Step 5: Build and test**

```bash
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -10
yarn test packages/api-headless-cms-ddb 2>&1 | tail -30
```

- [ ] **Step 6: Run before-commit checklist and commit**

```bash
git add packages/api-headless-cms-ddb/
git commit -m "refactor(api-headless-cms-ddb): migrate to DI factory abstractions"
```
