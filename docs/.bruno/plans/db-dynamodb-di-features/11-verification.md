# Task 11: Full Build + Test Verification

**Depends on:** Tasks 6-10

- [ ] **Step 1: Full monorepo build**

```bash
yarn build 2>&1 | tail -30
```

Expected: all 126 packages build successfully.

- [ ] **Step 2: Run db-dynamodb tests**

```bash
yarn test packages/db-dynamodb 2>&1 | tail -30
```

Expected: all 203 tests pass.

- [ ] **Step 3: Run consumer package tests**

```bash
yarn test packages/api-core-ddb 2>&1 | tail -30
yarn test packages/api-headless-cms-ddb 2>&1 | tail -30
```

- [ ] **Step 4: Verify no remaining references to deleted symbols**

```bash
grep -rn "createTable\b\|createStandardEntity\|createGlobalEntity\|DynamoDocClient\b" packages/*/src/ --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v features/DynamoDbDocumentClient
```

Expected: no matches from source files.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add .
git commit -m "chore: final cleanup after DI features migration"
```
