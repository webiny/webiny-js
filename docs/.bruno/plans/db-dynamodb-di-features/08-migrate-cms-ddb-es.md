# Task 8: Migrate `api-headless-cms-ddb-es`

**Depends on:** Task 5  
**Parallel with:** Tasks 6, 7, 9, 10

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/entry.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/group.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/definitions/model.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/feature.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/types.ts`
- Modify: `packages/api-headless-cms-ddb-es/__tests__/graphql/handler.ts`

**Pattern:** Same as Tasks 6-7. Additionally:
- `types.ts` has both `getTable: () => ITable` and `getEsTable: () => ITable` — update both to `DynamoDbDocumentClient.Interface`
- `__tests__/graphql/handler.ts` uses `createTable` — must migrate to `DynamoDbTableFactory`

---

- [ ] **Step 1: Update entity definitions + feature**

Replace `createTable`/`createStandardEntity` with factory calls in all definition files and `feature.ts`.

- [ ] **Step 2: Update `types.ts`**

Change both `getTable` and `getEsTable` return types from `ITable` to `DynamoDbDocumentClient.Interface`.

- [ ] **Step 3: Update test handler**

`__tests__/graphql/handler.ts` — replace `createTable` with table factory usage. This is a test file so the factory may need to be constructed manually or resolved from a test container.

- [ ] **Step 4: Build and test**

```bash
yarn build -p @webiny/api-headless-cms-ddb-es 2>&1 | tail -10
yarn test packages/api-headless-cms-ddb-es 2>&1 | tail -30
```

- [ ] **Step 5: Run before-commit checklist and commit**

```bash
git add packages/api-headless-cms-ddb-es/
git commit -m "refactor(api-headless-cms-ddb-es): migrate to DI factory abstractions"
```
