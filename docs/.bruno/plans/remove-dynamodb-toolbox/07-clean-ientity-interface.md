# Task 7: Update `IEntity` interface to remove `entity` property

**Files:**
- Modify: `packages/db-dynamodb/src/utils/entity/types.ts`
- Modify: Any consumer that accesses `.entity` on an `IEntity` (the `ElasticsearchSynchronize.ts` file is the known case)

**Interfaces:**
- Consumes: Completed Tasks 1-6
- Produces: Clean `IEntity` interface with `schema: EntitySchema` and `client: DynamoDocClient` instead of `entity: BaseEntity`

The old `IEntity` interface exposes `entity: BaseEntity` (the dynamodb-toolbox Entity). After Task 4, the `Entity` class has `schema` and `client` properties. Now update the `IEntity` interface and fix all consumers accessing `.entity`.

---

- [ ] **Step 1: Update `IEntity` in `types.ts`**

Replace `readonly entity: BaseEntity` with:
```typescript
readonly schema: EntitySchema;
readonly client: DynamoDocClient;
```

Remove the `import type { Entity as BaseEntity } from "dynamodb-toolbox"` import — this is the last remaining dynamodb-toolbox import in the codebase.

- [ ] **Step 2: Find and fix all `.entity` accesses on `IEntity`**

```bash
grep -r "\.entity\b" packages/ --include="*.ts" | grep -v node_modules | grep -v dist | grep -v "\.d\.ts" | grep -v "__tests__"
```

Known case: `ElasticsearchSynchronize.ts` calls `entity.item.entity.getBatch(...)`. This becomes `entity.item.schema.toGetKeys(...)`.

- [ ] **Step 3: Build and test**

Run: `yarn build 2>&1 | tail -50`
Run: `yarn test packages/db-dynamodb 2>&1 | tail -50`
Expected: All pass.

- [ ] **Step 4: Run before-commit checklist and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "refactor(db-dynamodb): clean IEntity interface — remove dynamodb-toolbox Entity type"
```
