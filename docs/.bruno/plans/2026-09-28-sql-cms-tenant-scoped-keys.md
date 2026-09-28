# SQL CMS Tenant-Scoped Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SQL CMS storage (`api-headless-cms-sql`, and `api-headless-cms-pg-os`, which reuses it) keep models, groups, entries and OpenSearch sync rows apart across tenants, with the same uniqueness rules as the DynamoDB storage.

**Architecture:** All tenants share one table per entity (`webiny_cms_models`, `webiny_cms_groups`, `webiny_cms_entries`, `cms_os_sync`). Each table's primary key is currently a single column, so a `modelId`, group `id` or entry `id` that exists in one tenant cannot be created in another tenant. Several update, delete and read queries also filter by that column alone. The fix does three things: it changes every primary key to a composite key that starts with `tenant`, it scopes every query by `tenant` (entry queries by `tenant` + `modelId`), and it adds shared storage-level tests that run on every storage.

**Tech Stack:** TypeScript, knex (SQLite, Postgres, PGlite drivers), vitest, Webiny DI (`@webiny/feature/api`).

**Spec:** No separate spec. The decisions below were agreed with Bruno on 2026-09-28 and are the spec.

## Decisions (the spec)

- Keys are composite columns, not a concatenated `pk` string:
  - models: `PRIMARY KEY (tenant, modelId)`
  - groups: `PRIMARY KEY (tenant, id)`
  - entries: `PRIMARY KEY (tenant, id)`, where `id` is the revision id (`entryId#0001`)
  - pg-os sync rows: `PRIMARY KEY (tenant, id)`, where `id` is `entryId:L` or `entryId:P`
- Entry uniqueness matches DynamoDB: one entry id is unique per tenant across all models (DDB `PK = T#{tenant}#CMS#CME#{entryId}`). The same custom entry id in two models of one tenant is not supported.
- Every entry query is still scoped by `tenant` and `modelId`, not by `tenant` alone.
- No foreign key from models to groups. `group` stays a plain text column.
- No migration. `next` is unreleased and the SQL storage has never shipped. Change the `createTable` definitions directly. Drop and re-create local and test databases.
- DDB and DDB-ES key formats are released and must not change. This plan touches no DDB or DDB-ES code.
- Tests go in the shared `api-headless-cms` suite, so they run on ddb, ddb-os, sql and pg-os. They cover cross-tenant isolation only, which every storage supports.

## Global Constraints

- Mark every primary key column `.notNullable()`. SQLite allows NULL in primary key columns on ordinary tables; Postgres does not.
- Use `table.primary([...])`, the same pattern as `api-core-sql/src/security/index.ts:55`.
- Do not change any file under `packages/api-headless-cms-ddb*`.
- Code style: one class per file, named exports, no inline object types (extract named interfaces), comment density like the surrounding code.
- Test commands (from `package.json`):
  - `yarn test <path>` for ddb
  - `yarn test:os <path>` for ddb-os
  - `yarn test:sql <path>` for SQLite
  - `yarn test:pglite <path>` for the Postgres dialect (in-process, no server needed)
  - `yarn test:pg:os <path>` for pg-os
- Work on the current branch `bruno/fix/api-headless-cms-sql/storage-keys`. Do not create a new branch.
- Commit after each task. Before each commit, run this chain (based on `CLAUDE.md`, with the `:fix` variants). If any step fails and you fix something, rerun the chain from the start.

  ```bash
  yarn > /dev/null 2>&1
  node scripts/generateTsConfigsInPackages.js
  yarn adio
  yarn check-ts-configs
  yarn format:fix > /dev/null 2>&1
  yarn lint:fix
  yarn lint
  yarn webiny sync-dependencies
  yarn build -p <each package the task touched> 2>&1 | tail -30
  ```

  Keep `yarn lint` after `lint:fix`. `lint:fix` does not use `--deny-warnings`, and `no-unused-vars` is only a warning in `.oxlintrc.json`. Without `yarn lint`, a leftover `query()` method or import would get through.

  **Never `git add .`.** The working tree has untracked folders that do not belong in these commits (`.design-sync/`, `.ds-sync/`, `ds-bundle/`), plus this plan file. Stage with `git add -u` (tracked files the chain changed, such as `yarn.lock` or tsconfig files) plus the explicit paths in each task's commit step. Check `git status --short` before each commit: only the task's files and chain-generated changes may be staged.

- Test fixtures must type-check. `packages/api-headless-cms/tsconfig.json` includes `__tests__`. `CmsModel.group` is a `string`, not an object, and `CmsEntry` has about 40 required fields. Do not copy the incomplete fixtures from `__tests__/storageOperations/helpers.ts`.
- Keep one `import type { ... } from "~/types"` line in the test file. Later tasks extend that line; they do not add a second one.

## Review Focus

1. **Postgres `ON CONFLICT` target.** `WriteEntry`, `WriteLatest` and `WritePublished` in pg-os use `.onConflict("id").merge()`. After the key change, Postgres rejects this with `there is no unique or exclusion constraint matching the ON CONFLICT specification`. The target must be `["tenant", "id"]`. Task 4 covers this; its test runs on PGlite, which enforces the rule.
2. **`syncEntryToLatest` without a tenant filter.** `queryHelpers.ts:47` finds the latest row by `entryId` + `isLatest` only, and `queryHelpers.ts:62-64` updates it by `id` only. After the key change, two tenants can share an `entryId`, and updating a non-latest revision in tenant A would write tenant A's data into tenant B's latest row. Task 3's test gives each tenant its own values (`"<tenant> v2"`) and checks that both tenants' v2 revisions keep their own name and tenant after the tenant A update. It checks both because the unscoped `.first()` has no ORDER BY and may pick either tenant's row.
3. **The id-only lookups and updates** in `SqlPublishEntry.ts:45-47` and `SqlCreateEntryRevisionFrom.ts:46-48,62-64` could change another tenant's `isLatest` / `isPublished` flags. Task 3's test catches these: it creates the revisions interleaved (A1, B1, A2, B2), publishes v1 in both tenants before publishing v2 in A, and checks tenant B's latest and published revisions. The test cannot catch the id-only `existing` reads (`SqlUpdateEntry.ts:35`, `SqlPublishEntry.ts:50`, `SqlUnpublishEntry.ts:35`), which only affect storage-specific flags. It also never runs Unpublish, DeleteRevision, DeleteMultiple, Move, MoveToBin or RestoreFromBin. Those are guarded only by the two greps in Task 3 Step 6.
4. **Stream simulation keyed by `id`.** `simulatePgStream.ts:54,59` builds its before and after maps keyed by `row.id`. Two tenants' rows with the same `id` would collapse into one map entry, and events would be lost or mislabeled. Task 4's test checks that two INSERT events arrive, one per tenant.
5. **A cross-model create with a colliding entry id** (same tenant, same `entryId`, different model). SQL now throws a primary-key violation, which core wraps as `EntryPersistenceError` (`CreateEntryRepository.ts`). Core has no duplicate check. DDB overwrites without an error, because a DynamoDB put replaces the item. This is an accepted difference. No test, because the storages differ by design.

## Out of scope (record, do not fix here)

- **OpenSearch shared-index mode.** With shared indexes, `DefaultCmsModelOpenSearchIndexProvider.ts:23` writes every tenant to the `root` index, and the document id is `entryId:L` / `entryId:P`. Two tenants with the same `entryId` then overwrite each other's OpenSearch documents. This affects ddb-es (released) and pg-os the same way. Track it separately.
- **The DDB cross-model entry id overwrite.** Released key format, so it stays as is.

## File Structure

Modified:
- `packages/api-headless-cms-sql/src/features/modelSchemaManager/ModelSchemaManager.ts`: composite key
- `packages/api-headless-cms-sql/src/features/groupSchemaManager/GroupSchemaManager.ts`: composite key
- `packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts`: composite key
- `packages/api-headless-cms-sql/src/operations/model/SqlUpdateModel.ts`, `SqlDeleteModel.ts`: tenant filter
- `packages/api-headless-cms-sql/src/operations/group/SqlUpdateGroup.ts`, `SqlDeleteGroup.ts`: tenant filter
- `packages/api-headless-cms-sql/src/operations/entry/queryHelpers.ts`: new `createModelEntryQuery`; `syncEntryToLatest` and `patchAllEntryRevisions` take the model
- `packages/api-headless-cms-sql/src/operations/entry/Sql{UpdateEntry,PublishEntry,UnpublishEntry,CreateEntryRevisionFrom,DeleteEntry,DeleteEntryRevision,DeleteMultipleEntries,MoveEntry,MoveToBin,RestoreFromBin}.ts`: model-scoped queries
- `packages/api-headless-cms-pg-os/src/features/syncTableManager/SyncTableManager.ts`: composite key
- `packages/api-headless-cms-pg-os/src/features/SyncWriter/{WriteEntry,WriteLatest,WritePublished,RemoveLatest,RemovePublished,RemoveEntry}.ts`: tenant-aware conflict target and delete filters
- `packages/api-headless-cms-pg-os/src/testing/simulatePgStream.ts`: row key includes tenant

Created:
- `packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts`: shared isolation tests (models, groups, entries)
- `packages/api-headless-cms-pg-os/__tests__/syncTenantIsolation.test.ts`: sync-row isolation

---

### Task 1: Models are tenant-scoped

**Files:**
- Create: `packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts`
- Modify: `packages/api-headless-cms-sql/src/features/modelSchemaManager/ModelSchemaManager.ts:29`
- Modify: `packages/api-headless-cms-sql/src/operations/model/SqlUpdateModel.ts:27`
- Modify: `packages/api-headless-cms-sql/src/operations/model/SqlDeleteModel.ts:23`

**Interfaces:**
- Consumes: `createPersonModel()` from `packages/api-headless-cms/__tests__/storageOperations/helpers.ts` (returns a `CmsModel` with `modelId: "personEntriesModel"`, `tenant: "root"`).
- Produces: in the test file, the constants `TENANT_A = "isolation-a"` and `TENANT_B = "isolation-b"`, the helper `createIsolationModel(tenant: string): CmsModel` (with `modelId: "isolationModel"`) and the `container` setup. Tasks 2 and 3 add `describe` blocks to the same file.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsModel } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createPersonModel } from "./helpers";
import { CreateModelStorageOperation } from "~/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { GetModelStorageOperation } from "~/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { UpdateModelStorageOperation } from "~/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { DeleteModelStorageOperation } from "~/features/shared/storageOperations/model/DeleteModelStorageOperation.js";

vi.setConfig({
    testTimeout: 100_000
});

const TENANT_A = "isolation-a";
const TENANT_B = "isolation-b";

/**
 * `createPersonModel()` returns `group` as an object, but `CmsModel.group` is a string.
 * better-sqlite3 cannot bind an object, so override `group` and `icon` here.
 */
const createIsolationModel = (tenant: string): CmsModel => {
    return {
        ...createPersonModel(),
        modelId: "isolationModel",
        name: "Isolation Model",
        group: "isolationGroup",
        icon: null,
        tenant
    };
};

describe("Storage operations - tenant isolation", () => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
    });

    describe("models", () => {
        it("should keep the same modelId apart across tenants on update and delete", async () => {
            const createModel = container.resolve(CreateModelStorageOperation);
            const getModel = container.resolve(GetModelStorageOperation);
            const updateModel = container.resolve(UpdateModelStorageOperation);
            const deleteModel = container.resolve(DeleteModelStorageOperation);

            const modelA = createIsolationModel(TENANT_A);
            const modelB = createIsolationModel(TENANT_B);

            await createModel.execute({ model: modelA });
            await createModel.execute({ model: modelB });

            await updateModel.execute({
                model: {
                    ...modelA,
                    name: "Changed in A"
                }
            });

            const updatedA = await getModel.execute({
                tenant: TENANT_A,
                modelId: modelA.modelId
            });
            const untouchedB = await getModel.execute({
                tenant: TENANT_B,
                modelId: modelB.modelId
            });
            expect(updatedA?.name).toEqual("Changed in A");
            expect(untouchedB?.name).toEqual("Isolation Model");

            await deleteModel.execute({ model: modelA });

            const deletedA = await getModel.execute({
                tenant: TENANT_A,
                modelId: modelA.modelId
            });
            const remainingB = await getModel.execute({
                tenant: TENANT_B,
                modelId: modelB.modelId
            });
            expect(deletedA).toBeNull();
            expect(remainingB?.name).toEqual("Isolation Model");

            await deleteModel.execute({ model: modelB });
        });
    });
});
```

- [ ] **Step 2: Run the test and check that it fails on SQL**

Run: `yarn test:sql packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -30`
Expected: FAIL. The second `createModel.execute` throws a unique constraint error (`SQLITE_CONSTRAINT_PRIMARYKEY` / `UNIQUE constraint failed: ...models.modelId`).

Run: `yarn test packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -30`
Expected: PASS on ddb (this confirms the test is valid for released storage).

- [ ] **Step 3: Change the model table key**

In `ModelSchemaManager.ts`, replace line 29 (`table.text("modelId").primary().notNullable();`) and add the composite key after the last column (`table.text("settings");`):

```ts
                table.text("modelId").notNullable();
```

```ts
                table.text("settings");

                table.primary(["tenant", "modelId"]);
```

- [ ] **Step 4: Scope model update and delete by tenant**

`SqlUpdateModel.ts`, replace the query in `execute`:

```ts
        await this.knex
            .client<IModelRow>(this.tableName)
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .update(row);
```

`SqlDeleteModel.ts`, replace the query in `execute`:

```ts
        await this.knex
            .client<IModelRow>(this.tableName)
            .where("tenant", params.model.tenant)
            .andWhere("modelId", params.model.modelId)
            .delete();
```

- [ ] **Step 5: Run the test on every storage and check that it passes**

```bash
yarn test:sql packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
yarn test:pglite packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
yarn test packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
yarn test:os packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
```

Expected: PASS on all four.

- [ ] **Step 6: Commit**

Run the pre-commit chain (Global Constraints), then:

```bash
git add packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts packages/api-headless-cms-sql/src/features/modelSchemaManager/ModelSchemaManager.ts packages/api-headless-cms-sql/src/operations/model/SqlUpdateModel.ts packages/api-headless-cms-sql/src/operations/model/SqlDeleteModel.ts
git commit -m "fix(api-headless-cms-sql): scope model keys and queries by tenant"
```

---

### Task 2: Groups are tenant-scoped

**Files:**
- Modify: `packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts`
- Modify: `packages/api-headless-cms-sql/src/features/groupSchemaManager/GroupSchemaManager.ts:29`
- Modify: `packages/api-headless-cms-sql/src/operations/group/SqlUpdateGroup.ts:24`
- Modify: `packages/api-headless-cms-sql/src/operations/group/SqlDeleteGroup.ts:21`

**Interfaces:**
- Consumes: `TENANT_A`, `TENANT_B` and `container` from Task 1.
- Produces: `createIsolationGroup(tenant: string): CmsGroup` in the test file.

- [ ] **Step 1: Write the failing test**

Change the type import at the top of `tenantIsolation.test.ts` to `import type { CmsGroup, CmsModel } from "~/types";`, and add these imports:

```ts
import { CreateGroupStorageOperation } from "~/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { GetGroupStorageOperation } from "~/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { UpdateGroupStorageOperation } from "~/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { DeleteGroupStorageOperation } from "~/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
```

Add this helper under `createIsolationModel`:

```ts
const createIsolationGroup = (tenant: string): CmsGroup => {
    return {
        id: "isolationGroup",
        name: "Isolation Group",
        slug: "isolation-group",
        tenant,
        description: null,
        icon: null
    };
};
```

Add this block inside `describe("Storage operations - tenant isolation")`, after `describe("models")`:

```ts
    describe("groups", () => {
        it("should keep the same group id apart across tenants on update and delete", async () => {
            const createGroup = container.resolve(CreateGroupStorageOperation);
            const getGroup = container.resolve(GetGroupStorageOperation);
            const updateGroup = container.resolve(UpdateGroupStorageOperation);
            const deleteGroup = container.resolve(DeleteGroupStorageOperation);

            const groupA = createIsolationGroup(TENANT_A);
            const groupB = createIsolationGroup(TENANT_B);

            await createGroup.execute({ group: groupA });
            await createGroup.execute({ group: groupB });

            await updateGroup.execute({
                group: {
                    ...groupA,
                    name: "Changed in A"
                }
            });

            const updatedA = await getGroup.execute({ tenant: TENANT_A, id: groupA.id });
            const untouchedB = await getGroup.execute({ tenant: TENANT_B, id: groupB.id });
            expect(updatedA?.name).toEqual("Changed in A");
            expect(untouchedB?.name).toEqual("Isolation Group");

            await deleteGroup.execute({ group: groupA });

            const deletedA = await getGroup.execute({ tenant: TENANT_A, id: groupA.id });
            const remainingB = await getGroup.execute({ tenant: TENANT_B, id: groupB.id });
            expect(deletedA).toBeNull();
            expect(remainingB?.name).toEqual("Isolation Group");

            await deleteGroup.execute({ group: groupB });
        });
    });
```

- [ ] **Step 2: Run the test and check that it fails on SQL**

Run: `yarn test:sql packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts -t groups 2>&1 | tail -30`
Expected: FAIL. The second `createGroup.execute` throws a unique constraint error on `groups.id`.

- [ ] **Step 3: Change the group table key**

In `GroupSchemaManager.ts`, replace line 29 (`table.text("id").primary().notNullable();`), and add the key after `table.boolean("isPlugin")...`:

```ts
                table.text("id").notNullable();
```

```ts
                table.boolean("isPlugin").notNullable().defaultTo(false);

                table.primary(["tenant", "id"]);
```

- [ ] **Step 4: Scope group update and delete by tenant**

`SqlUpdateGroup.ts`, replace the query in `execute`:

```ts
        await this.knex
            .client<IGroupRow>(this.tableName)
            .where("tenant", params.group.tenant)
            .andWhere("id", params.group.id)
            .update(row);
```

`SqlDeleteGroup.ts`, replace the query in `execute`:

```ts
        await this.knex
            .client<IGroupRow>(this.tableName)
            .where("tenant", params.group.tenant)
            .andWhere("id", params.group.id)
            .delete();
```

- [ ] **Step 5: Run the test on every storage and check that it passes**

Run the four commands from Task 1 Step 5.
Expected: PASS on all four (models and groups).

- [ ] **Step 6: Commit**

Run the pre-commit chain, then:

```bash
git add packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts packages/api-headless-cms-sql/src/features/groupSchemaManager/GroupSchemaManager.ts packages/api-headless-cms-sql/src/operations/group/SqlUpdateGroup.ts packages/api-headless-cms-sql/src/operations/group/SqlDeleteGroup.ts
git commit -m "fix(api-headless-cms-sql): scope group keys and queries by tenant"
```

---

### Task 3: Entries are tenant-scoped

**Files:**
- Modify: `packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts`
- Modify: `packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts:58`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/queryHelpers.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlUpdateEntry.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlPublishEntry.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlUnpublishEntry.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlCreateEntryRevisionFrom.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlDeleteEntry.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlDeleteEntryRevision.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlDeleteMultipleEntries.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlMoveEntry.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlMoveToBin.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/SqlRestoreFromBin.ts`

**Interfaces:**
- Consumes: `TENANT_A`, `TENANT_B`, `createIsolationModel` and `container` from Task 1.
- Produces, in `queryHelpers.ts`:
  - `interface IEntryQueryModel { tenant: string; modelId: string }`
  - `createModelEntryQuery(knex: Knex, tableName: string, model: IEntryQueryModel): Knex.QueryBuilder<IEntryRow>`, a query already filtered by `tenant` and `modelId`
  - `syncEntryToLatest(knex: Knex, tableName: string, model: IEntryQueryModel, entry: CmsStorageEntry, extraPatch?: (latest: CmsEntry) => void): Promise<void>`
  - `patchAllEntryRevisions(knex: Knex, tableName: string, model: IEntryQueryModel, entryId: string, patch: (entry: CmsEntry) => void, columnUpdates?: Partial<IEntryRow>): Promise<void>`

  Task 4 (pg-os) does not call these helpers. pg-os wraps the SQL ops, so it inherits the fixes.

- [ ] **Step 1: Write the failing test**

Change the type import at the top of `tenantIsolation.test.ts` to `import type { CmsEntry, CmsEntryStatus, CmsGroup, CmsIdentity, CmsModel } from "~/types";`. If `CmsEntryStatus` is not exported from `~/types`, import it from `~/types/types.js`. Add these imports:

```ts
import { createIdentifier } from "@webiny/utils";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
```

Add this fixture under `createIsolationGroup`. It fills every required `CmsEntry` field. Each tenant gets its own values (`"<tenant> v<version>"`), so a row written into the wrong tenant is visible in the assertions.

```ts
const ISOLATION_ENTRY_ID = "isolationentry";

const identity: CmsIdentity = {
    id: "admin",
    type: "admin",
    displayName: "admin"
};

interface CreateIsolationEntryParams {
    model: CmsModel;
    version: number;
    status: CmsEntryStatus;
    name?: string;
}

const createIsolationEntry = (params: CreateIsolationEntryParams): CmsEntry => {
    const { model, version, status } = params;
    const now = new Date().toISOString();
    return {
        id: createIdentifier({ id: ISOLATION_ENTRY_ID, version }),
        entryId: ISOLATION_ENTRY_ID,
        tenant: model.tenant,
        modelId: model.modelId,
        version,
        locked: false,
        status,
        values: {
            name: params.name ?? `${model.tenant} v${version}`
        },
        createdOn: now,
        savedOn: now,
        modifiedOn: null,
        deletedOn: null,
        restoredOn: null,
        firstPublishedOn: null,
        lastPublishedOn: null,
        createdBy: identity,
        savedBy: identity,
        modifiedBy: null,
        deletedBy: null,
        restoredBy: null,
        firstPublishedBy: null,
        lastPublishedBy: null,
        revisionCreatedOn: now,
        revisionSavedOn: now,
        revisionModifiedOn: null,
        revisionDeletedOn: null,
        revisionRestoredOn: null,
        revisionFirstPublishedOn: null,
        revisionLastPublishedOn: null,
        revisionCreatedBy: identity,
        revisionSavedBy: identity,
        revisionModifiedBy: null,
        revisionDeletedBy: null,
        revisionRestoredBy: null,
        revisionFirstPublishedBy: null,
        revisionLastPublishedBy: null,
        live: null,
        revisionDescription: undefined,
        expiresAt: null
    };
};
```

Add this block inside the top-level `describe`, after `describe("groups")`. The steps are interleaved (A1, B1, A2, B2) on purpose. Each id-only query in the SQL ops then has a same-id row from the other tenant to hit by mistake.

```ts
    describe("entries", () => {
        it("should keep the same entry id apart across tenants", async () => {
            const createEntry = container.resolve(CreateEntryStorageOperation);
            const createRevisionFrom = container.resolve(CreateEntryRevisionFromStorageOperation);
            const updateEntry = container.resolve(UpdateEntryStorageOperation);
            const publishEntry = container.resolve(PublishEntryStorageOperation);
            const getRevisionById = container.resolve(GetRevisionByIdStorageOperation);
            const getLatest = container.resolve(GetLatestRevisionByEntryIdStorageOperation);
            const getPublished = container.resolve(GetPublishedRevisionByEntryIdStorageOperation);
            const deleteEntry = container.resolve(DeleteEntryStorageOperation);

            const modelA = createIsolationModel(TENANT_A);
            const modelB = createIsolationModel(TENANT_B);
            const id1 = createIdentifier({ id: ISOLATION_ENTRY_ID, version: 1 });
            const id2 = createIdentifier({ id: ISOLATION_ENTRY_ID, version: 2 });

            /**
             * v1 in both tenants, published in both tenants.
             */
            for (const model of [modelA, modelB]) {
                const draft = createIsolationEntry({ model, version: 1, status: "draft" });
                await createEntry.execute(model, { entry: draft, storageEntry: draft });
                const published = createIsolationEntry({ model, version: 1, status: "published" });
                await publishEntry.execute(model, { entry: published, storageEntry: published });
            }

            /**
             * v2 in tenant A only. Tenant B's v1 must stay latest.
             * Catches the id-only `isLatest` reset in SqlCreateEntryRevisionFrom.
             */
            const a2 = createIsolationEntry({ model: modelA, version: 2, status: "draft" });
            await createRevisionFrom.execute(modelA, { entry: a2, storageEntry: a2 });

            const latestBBeforeB2 = await getLatest.execute(modelB, { id: ISOLATION_ENTRY_ID });
            expect(latestBBeforeB2?.id).toEqual(id1);
            expect(latestBBeforeB2?.tenant).toEqual(TENANT_B);

            const b2 = createIsolationEntry({ model: modelB, version: 2, status: "draft" });
            await createRevisionFrom.execute(modelB, { entry: b2, storageEntry: b2 });

            /**
             * Update the non-latest revision in tenant A.
             * Catches the unscoped latest-row sync in syncEntryToLatest.
             */
            const changedA1 = createIsolationEntry({
                model: modelA,
                version: 1,
                status: "published",
                name: "isolation-a v1 changed"
            });
            await updateEntry.execute(modelA, { entry: changedA1, storageEntry: changedA1 });

            const a1AfterUpdate = await getRevisionById.execute(modelA, { id: id1 });
            const b1AfterUpdate = await getRevisionById.execute(modelB, { id: id1 });
            const b2AfterUpdate = await getRevisionById.execute(modelB, { id: id2 });
            expect(a1AfterUpdate?.values.name).toEqual("isolation-a v1 changed");
            expect(b1AfterUpdate?.values.name).toEqual("isolation-b v1");
            expect(b2AfterUpdate?.values.name).toEqual("isolation-b v2");
            expect(b2AfterUpdate?.tenant).toEqual(TENANT_B);
            /**
             * An unscoped `.first()` may pick either tenant's v2 row, so check both v2 rows.
             * Only `tenant` is checked for A2: DDB rewrites the latest revision with
             * un-converted values when a non-latest revision is updated (DdbUpdateEntry),
             * so A2's `values` are not reliable on DDB.
             */
            const a2AfterUpdate = await getRevisionById.execute(modelA, { id: id2 });
            expect(a2AfterUpdate?.tenant).toEqual(TENANT_A);

            /**
             * Publish v2 in tenant A. Tenant B's v1 must stay published.
             * Catches the id-only "unpublish previous" update in SqlPublishEntry.
             */
            const publishedA2 = createIsolationEntry({
                model: modelA,
                version: 2,
                status: "published"
            });
            await publishEntry.execute(modelA, { entry: publishedA2, storageEntry: publishedA2 });

            const publishedA = await getPublished.execute(modelA, { id: ISOLATION_ENTRY_ID });
            const publishedB = await getPublished.execute(modelB, { id: ISOLATION_ENTRY_ID });
            const latestB = await getLatest.execute(modelB, { id: ISOLATION_ENTRY_ID });
            expect(publishedA?.id).toEqual(id2);
            expect(publishedB?.id).toEqual(id1);
            expect(publishedB?.status).toEqual("published");
            expect(publishedB?.values.name).toEqual("isolation-b v1");
            expect(latestB?.id).toEqual(id2);
            expect(latestB?.values.name).toEqual("isolation-b v2");

            /**
             * Delete the whole entry in tenant A. Tenant B keeps both revisions.
             */
            await deleteEntry.execute(modelA, { entry: publishedA2 });

            expect(await getRevisionById.execute(modelA, { id: id1 })).toBeNull();
            expect(await getRevisionById.execute(modelA, { id: id2 })).toBeNull();
            const remainingB1 = await getRevisionById.execute(modelB, { id: id1 });
            const remainingB2 = await getRevisionById.execute(modelB, { id: id2 });
            expect(remainingB1?.values.name).toEqual("isolation-b v1");
            expect(remainingB2?.values.name).toEqual("isolation-b v2");

            await deleteEntry.execute(modelB, { entry: b2 });
        });
    });
```

The test passes on SQL only when both the key change (Step 3) and the query scoping (Steps 4-5) are in place. Step 3b checks this.

- [ ] **Step 2: Run the test and check that it fails on SQL and passes on ddb**

Run: `yarn test:sql packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts -t entries 2>&1 | tail -30`
Expected: FAIL. The tenant B `createEntry.execute` throws a unique constraint error on `entries.id`.

Run: `yarn test packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts -t entries 2>&1 | tail -30`
Expected: PASS. If ddb fails, the fixture is wrong, not the storage. Fix the fixture until ddb passes before you continue: for example, DDB publish may need extra entry fields. Compare with `packages/api-headless-cms/__tests__/storageOperations/helpers.ts` and with the DDB op under `packages/api-headless-cms-ddb/src/operations/entry/`.

- [ ] **Step 3: Change the entry table key**

In `EntryTableManager.ts` `createTable`, replace `table.text("id").primary();` and add the key before the indexes:

```ts
                table.text("id").notNullable();
```

```ts
                table.text("data").notNullable();

                table.primary(["tenant", "id"]);

                table.index(["tenant", "modelId", "isLatest"]);
```

- [ ] **Step 3b: Run the test and check that the key change alone is not enough**

Run: `yarn test:sql packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts -t entries 2>&1 | tail -30`
Expected: FAIL at `expect(latestBBeforeB2?.id).toEqual(id1)`. Tenant B's v1 is no longer latest, because `SqlCreateEntryRevisionFrom` resets `isLatest` by `id` alone, and that also hits tenant B's row. If the test passes here, the test is not checking the query scoping. Stop and fix the test before you continue.

- [ ] **Step 4: Add the model-scoped query and scope the helpers**

In `queryHelpers.ts`, add after `createEntryQuery`:

```ts
export interface IEntryQueryModel {
    tenant: string;
    modelId: string;
}

export const createModelEntryQuery = (
    knex: Knex,
    tableName: string,
    model: IEntryQueryModel
): Knex.QueryBuilder<IEntryRow> => {
    return createEntryQuery(knex, tableName)
        .where("tenant", model.tenant)
        .andWhere("modelId", model.modelId);
};
```

Replace `syncEntryToLatest` with:

```ts
export const syncEntryToLatest = async (
    knex: Knex,
    tableName: string,
    model: IEntryQueryModel,
    entry: CmsStorageEntry,
    extraPatch?: (latest: CmsEntry) => void
): Promise<void> => {
    if (entry.isLatest) {
        return;
    }

    const latestRow = await createModelEntryQuery(knex, tableName, model)
        .andWhere("entryId", entry.entryId)
        .andWhere("isLatest", true)
        .first();

    if (!latestRow) {
        return;
    }

    const latest = JSON.parse(latestRow.data);
    const merged = mergeEntryLevelMeta(entry, latest);

    if (extraPatch) {
        extraPatch(merged);
    }

    await createModelEntryQuery(knex, tableName, model)
        .andWhere("id", latestRow.id)
        .update({ data: JSON.stringify(merged) });
};
```

Replace `patchAllEntryRevisions` with this version. The `model` parameter replaces `tenant: string` and moves before `entryId`:

```ts
export const patchAllEntryRevisions = async (
    knex: Knex,
    tableName: string,
    model: IEntryQueryModel,
    entryId: string,
    patch: (entry: CmsEntry) => void,
    columnUpdates?: Partial<IEntryRow>
): Promise<void> => {
    const rows = await createModelEntryQuery(knex, tableName, model).andWhere("entryId", entryId);

    if (rows.length === 0) {
        return;
    }

    const cases: Array<{ id: string; data: string }> = rows.map((row: IEntryRow) => {
        const parsed = JSON.parse(row.data);
        patch(parsed);
        return { id: row.id, data: JSON.stringify(parsed) };
    });

    const update: Record<string, unknown> = {
        data: knex.raw(
            `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
            cases.flatMap((c: { id: string; data: string }) => [c.id, c.data])
        ),
        ...columnUpdates
    };

    await createModelEntryQuery(knex, tableName, model)
        .andWhere("entryId", entryId)
        .update(update);
};
```

- [ ] **Step 5: Use model-scoped queries in every entry write op**

In each op below, add `createModelEntryQuery` to the `./queryHelpers.js` import and add this private method next to the existing `query()`:

```ts
    private modelQuery(model: CmsModel): Knex.QueryBuilder<IEntryRow> {
        return createModelEntryQuery(this.knex, this.entryTableManager.getTableName(), model);
    }
```

Then replace the queries exactly as listed. If `query()` is no longer used in a file, remove it and the unused `createEntryQuery` import.

`SqlUpdateEntry.ts` `execute`:

```ts
        const existing = await this.modelQuery(model).andWhere("id", params.storageEntry.id).first();
        ...
        await this.modelQuery(model).andWhere("id", params.storageEntry.id).update(rowWithoutFlags);

        await syncEntryToLatest(this.knex, this.entryTableManager.getTableName(), model, se);
```

`SqlPublishEntry.ts` `execute`:

```ts
        const oldPublishedRows = await this.modelQuery(model)
            .andWhere("entryId", params.entry.entryId)
            .andWhere("isPublished", true);

        for (const row of oldPublishedRows) {
            const parsed = JSON.parse(row.data);
            parsed.isPublished = false;
            parsed.status = "unpublished";

            await this.modelQuery(model)
                .andWhere("id", row.id)
                .update({ isPublished: false, data: JSON.stringify(parsed) });
        }

        const existing = await this.modelQuery(model).andWhere("id", params.storageEntry.id).first();
        ...
        await this.modelQuery(model)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        const liveValue = { version: params.entry.version };
        await syncEntryToLatest(
            this.knex,
            this.entryTableManager.getTableName(),
            model,
            se,
            latest => {
                latest.live = liveValue;
            }
        );
```

`SqlUnpublishEntry.ts` `execute`:

```ts
        const existing = await this.modelQuery(model).andWhere("id", params.storageEntry.id).first();
        ...
        await this.modelQuery(model)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        await syncEntryToLatest(
            this.knex,
            this.entryTableManager.getTableName(),
            model,
            se,
            latest => {
                latest.live = null;
            }
        );
```

`SqlCreateEntryRevisionFrom.ts` `execute`. The two `where("tenant", ...).andWhere("entryId", ...)` selects become `this.modelQuery(model).andWhere("entryId", params.entry.entryId)...`, and both `where("id", row.id).update(...)` calls become:

```ts
                await this.modelQuery(model)
                    .andWhere("id", row.id)
                    .update({ isLatest: false, data: JSON.stringify(parsed) });
```

(and the same with `isPublished: false` in the published loop). The `insert(row)` stays on `this.query()`.

`SqlDeleteEntry.ts` `execute`:

```ts
        await this.modelQuery(model).andWhere("entryId", entryId).delete();
```

`SqlDeleteMultipleEntries.ts` `execute`:

```ts
        await this.modelQuery(model).whereIn("entryId", entryIds).delete();
```

`SqlDeleteEntryRevision.ts` `execute`:

```ts
        await this.modelQuery(model).andWhere("id", params.storageEntry.id).delete();

        if (wasPublished) {
            await patchAllEntryRevisions(
                this.knex,
                this.entryTableManager.getTableName(),
                model,
                params.storageEntry.entryId,
                parsed => {
                    parsed.live = null;
                }
            );
        }
        ...
            await this.modelQuery(model)
                .andWhere("id", params.latestStorageEntry.id)
                .update(latestRow);
```

`SqlMoveEntry.ts`, `SqlMoveToBin.ts`, `SqlRestoreFromBin.ts`: change each `patchAllEntryRevisions(knex, tableName, <entryId>, model.tenant, patch, ...)` call to `patchAllEntryRevisions(knex, tableName, model, <entryId>, patch, ...)`. These files need no `modelQuery`.

- [ ] **Step 6: Check that no entry query filters by `id` or `entryId` alone**

The test does not run Unpublish, DeleteRevision, DeleteMultiple, Move, MoveToBin or RestoreFromBin. These two greps are the only guard for those ops.

Check 1: every `where("id"` / `where("entryId"` sits in a scoped chain.

Run: `grep -nE '\.where\("(id|entryId)"' packages/api-headless-cms-sql/src/operations/entry/*.ts`
Expected output: these five read-op lines and nothing else (grep prints the full path; the order may vary by shell):

```
packages/api-headless-cms-sql/src/operations/entry/SqlGetLatestRevisionByEntryId.ts:42:            .where("entryId", entryId)
packages/api-headless-cms-sql/src/operations/entry/SqlGetPreviousRevision.ts:37:            .where("entryId", params.entryId)
packages/api-headless-cms-sql/src/operations/entry/SqlGetPublishedRevisionByEntryId.ts:42:            .where("entryId", entryId)
packages/api-headless-cms-sql/src/operations/entry/SqlGetRevisionById.ts:37:            .where("id", params.id)
packages/api-headless-cms-sql/src/operations/entry/SqlGetRevisions.ts:40:            .where("entryId", entryId)
```

In each of them, `.where("tenant", model.tenant).andWhere("modelId", model.modelId)` comes first in the same chain.

Check 2: every remaining unscoped `this.query()` is either an insert or a read that scopes itself on the next line. This also catches an unscoped `this.query().andWhere("id", ...)` or `.whereIn("id", ...)`, which check 1 misses.

Run: `grep -n -A1 'this\.query()' packages/api-headless-cms-sql/src/operations/entry/*.ts`
Expected: each hit is one of these two cases:
- `this.query().insert(row)` in `SqlCreateEntry.ts` or `SqlCreateEntryRevisionFrom.ts`
- a read op (`SqlGetEntriesByIds`, `SqlGetLatestEntriesByIds`, `SqlGetLatestRevisionByEntryId`, `SqlGetPreviousRevision`, `SqlGetPublishedRevisionByEntryId`, `SqlGetPublishedEntriesByIds`, `SqlGetRevisions`, `SqlGetRevisionById`) whose next line is `.where("tenant", model.tenant)`

Any hit in a write op other than the two inserts is an unscoped query: change it to `this.modelQuery(model)`.

- [ ] **Step 7: Build the package**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30`
Expected: build succeeds with no type errors.

- [ ] **Step 8: Run the tests on every storage**

```bash
yarn test:sql packages/api-headless-cms/__tests__/storageOperations 2>&1 | tail -20
yarn test:pglite packages/api-headless-cms/__tests__/storageOperations 2>&1 | tail -20
yarn test packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
yarn test:os packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
yarn test:pg:os packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
```

Expected: PASS on all five. The `storageOperations` directory also runs the existing `entries.test.ts` and `fieldUniqueValues.test.ts` on SQL as a regression check. pg-os passes here even before Task 4: the sync table still has `PRIMARY KEY (id)`, so `onConflict("id")` works but quietly overwrites the other tenant's sync row. Only Task 4's own test catches that.

- [ ] **Step 9: Commit**

Run the pre-commit chain, then:

```bash
git add packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts packages/api-headless-cms-sql/src/operations/entry
git commit -m "fix(api-headless-cms-sql): scope entry keys and queries by tenant and model"
```

---

### Task 4: pg-os sync rows are tenant-scoped

**Files:**
- Create: `packages/api-headless-cms-pg-os/__tests__/syncTenantIsolation.test.ts`
- Modify: `packages/api-headless-cms-pg-os/src/features/syncTableManager/SyncTableManager.ts:55`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/WriteEntry.ts:22`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/WriteLatest.ts:14`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/WritePublished.ts:14`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/RemoveLatest.ts:8`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/RemovePublished.ts:8`
- Modify: `packages/api-headless-cms-pg-os/src/features/SyncWriter/RemoveEntry.ts:11`
- Modify: `packages/api-headless-cms-pg-os/src/testing/simulatePgStream.ts:54,59,64,75`

**Interfaces:**
- Consumes: `createSyncTestSetup`, `createModel` and `createEntry` from `packages/api-headless-cms-pg-os/__tests__/helpers/createSyncTestSetup.ts`. The setup returns `{ knex, container, syncTableManager, writeEntry, writeLatest, removeLatest, capturedEvents, resetState, cleanup }`. `RemoveLatest.Params` and `RemoveEntry.Params` are both `{ model: { tenant, modelId }, entryId }`. `WriteEntry` writes the L row, plus the P row when `entry.status === "published"`.
- Produces: nothing for other tasks.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-pg-os/__tests__/syncTenantIsolation.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createSyncTestSetup, createModel, createEntry } from "./helpers/createSyncTestSetup";

const TENANT_A = "isolation-a";
const TENANT_B = "isolation-b";

describe("PG-OS sync rows - tenant isolation", () => {
    let setup: Awaited<ReturnType<typeof createSyncTestSetup>>;

    beforeAll(async () => {
        setup = await createSyncTestSetup();
    });

    afterAll(async () => {
        await setup.cleanup();
    });

    beforeEach(async () => {
        await setup.resetState();
    });

    it("should keep the same entryId apart across tenants", { timeout: 120_000 }, async () => {
        const modelA = createModel({ tenant: TENANT_A }) as any;
        const modelB = createModel({ tenant: TENANT_B }) as any;
        const entryA = createEntry({ tenant: TENANT_A, values: { title: "A" } }) as any;
        const entryB = createEntry({ tenant: TENANT_B, values: { title: "B" } }) as any;

        await setup.writeLatest.execute({ model: modelA, entry: entryA, storageEntry: entryA });
        await setup.writeLatest.execute({ model: modelB, entry: entryB, storageEntry: entryB });

        const inserts = setup.capturedEvents.filter(event => event.type === "INSERT");
        expect(inserts.map(event => event.tenant).sort()).toEqual([TENANT_A, TENANT_B]);

        const rows = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(rows).toHaveLength(2);

        await setup.removeLatest.execute({ model: modelA, entryId: entryA.entryId });

        const remaining = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(remaining).toHaveLength(1);
        expect(remaining[0].tenant).toEqual(TENANT_B);
        expect(remaining[0].id).toEqual("entry1:L");
    });

    it("should remove only one tenant's latest and published rows", { timeout: 120_000 }, async () => {
        const removeEntry = setup.container.resolve(RemoveEntry);
        const modelA = createModel({ tenant: TENANT_A }) as any;
        const modelB = createModel({ tenant: TENANT_B }) as any;
        const entryA = createEntry({ tenant: TENANT_A, status: "published", values: { title: "A" } }) as any;
        const entryB = createEntry({ tenant: TENANT_B, status: "published", values: { title: "B" } }) as any;

        /**
         * A published entry writes both the L and the P row.
         */
        await setup.writeEntry.execute({ model: modelA, entry: entryA, storageEntry: entryA });
        await setup.writeEntry.execute({ model: modelB, entry: entryB, storageEntry: entryB });

        const rows = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(rows).toHaveLength(4);

        await removeEntry.execute({ model: modelA, entryId: entryA.entryId });

        const remaining = await setup.knex(setup.syncTableManager.getTableName()).select("*");
        expect(remaining.map(row => `${row.tenant}:${row.id}`).sort()).toEqual([
            `${TENANT_B}:entry1:L`,
            `${TENANT_B}:entry1:P`
        ]);
    });
});
```

Add this import at the top of the file:

```ts
import { RemoveEntry } from "../src/features/SyncWriter/abstractions/RemoveEntry.js";
```

- [ ] **Step 2: Run the test and check that it fails**

Run: `yarn test:pg:os packages/api-headless-cms-pg-os/__tests__/syncTenantIsolation.test.ts 2>&1 | tail -30`
Expected: both tests FAIL. The tenant B write hits `onConflict("id").merge()` and overwrites tenant A's row. The first test fails at the `inserts` assertion, because tenant B's write shows up as a MODIFY event, not an INSERT. The second test fails at `toHaveLength(4)` with 2 rows.

- [ ] **Step 3: Change the sync table key**

In `SyncTableManager.ts` `createTable`, replace `table.text("id").primary();`. Then replace `table.index(["tenant"]);` with the composite key. The key's leading `tenant` column covers tenant lookups, so the separate index is no longer needed.

```ts
                table.text("id").notNullable();
```

```ts
                table.text("tenant").notNullable();

                table.primary(["tenant", "id"]);
```

- [ ] **Step 4: Make the conflict targets tenant-aware**

In `WriteEntry.ts`, `WriteLatest.ts` and `WritePublished.ts`, replace `.onConflict("id")` with:

```ts
.onConflict(["tenant", "id"])
```

- [ ] **Step 5: Scope the sync deletes by tenant**

`RemoveLatest.ts` `execute`:

```ts
        await this.syncRowQuery
            .create()
            .where("tenant", params.model.tenant)
            .andWhere("id", `${params.entryId}:L`)
            .delete();
```

`RemovePublished.ts` `execute`:

```ts
        await this.syncRowQuery
            .create()
            .where("tenant", params.model.tenant)
            .andWhere("id", `${params.entryId}:P`)
            .delete();
```

`RemoveEntry.ts` `execute`:

```ts
        const { model, entryId } = params;
        await this.syncRowQuery
            .create()
            .where("tenant", model.tenant)
            .whereIn("id", [`${entryId}:L`, `${entryId}:P`])
            .delete();
```

- [ ] **Step 6: Key the stream simulation by tenant and id**

In `simulatePgStream.ts`, add above `simulatePgStream`:

```ts
const createRowKey = (row: ISyncRow): string => {
    return `${row.tenant}:${row.id}`;
};
```

Change the two maps to use it:

```ts
        const beforeMap = new Map(rowsBefore.map(row => [createRowKey(row), row]));
```

```ts
        const afterMap = new Map(rowsAfter.map(row => [createRowKey(row), row]));
```

The loops at lines 64 and 75 iterate over map keys and compare them. Rename the loop variable from `id` to `key`. The logic stays the same, because both maps use the same key function.

- [ ] **Step 7: Run the pg-os tests and check that they pass**

```bash
yarn test:pg:os packages/api-headless-cms-pg-os 2>&1 | tail -30
yarn test:pg:os packages/api-headless-cms/__tests__/storageOperations/tenantIsolation.test.ts 2>&1 | tail -20
```

Expected: PASS. This includes the existing `syncStream.test.ts` (INSERT / MODIFY / REMOVE detection) and the shared isolation test on pg-os.

- [ ] **Step 8: Commit**

Run the pre-commit chain, then:

```bash
git add packages/api-headless-cms-pg-os
git commit -m "fix(api-headless-cms-pg-os): scope sync row keys by tenant"
```

---

### Task 5: Full verification

- [ ] **Step 1: Build the affected packages**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -30
```

Expected: both succeed.

- [ ] **Step 2: Run the full SQL and pg-os suites**

```bash
yarn test:sql packages/api-headless-cms 2>&1 | tail -50
yarn test:pglite packages/api-headless-cms/__tests__/storageOperations 2>&1 | tail -20
yarn test:pg:os packages/api-headless-cms-pg-os 2>&1 | tail -30
```

Expected: no new failures compared with `next`. If a failure looks unrelated, run the same command on `next` (`git stash` is not needed, use `git worktree`) and compare before claiming it is pre-existing.

- [ ] **Step 3: Run the pre-commit chain one last time and commit any formatting changes**

If the chain changed nothing, there is nothing to commit.
