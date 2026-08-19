# DDB Entry Storage Ops — Per-Method DI Split

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the monolithic `createEntriesStorageOperations` factory in `api-headless-cms-ddb` into 22 individual DI classes, each implementing one per-method entry storage abstraction via `createImplementation`.

**Architecture:** Each method becomes its own DI class file in `operations/entry/`. Shared state (DataLoadersHandler) becomes a DI abstraction registered per-request via `registerFactory`. A typed feature map enforces compile-time completeness — missing an operation causes a TypeScript error.

**Tech Stack:** TypeScript, `@webiny/di` (`createImplementation`, `createAbstraction`), `@webiny/feature/api` (`createFeature`)

## Global Constraints

- One abstraction/implementation per file
- Export name matches abstraction name (e.g., `DdbCreateEntry`)
- Implementation class name: `Ddb<Op>Impl`
- Dependencies listed explicitly — no grouped base abstractions
- Use namespace pattern for types: `export namespace DdbCreateEntry { export type Interface = ... }`
- All utility functions (`convertToStorageEntry`, `convertFromStorageEntry`, `createKeys`, etc.) stay as importable functions in existing files — not injected
- Test after each task: `yarn test packages/api-headless-cms --shard=1/64` (stop on first failure)
- Commit after each task

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/abstractions/CmsDdbDataLoaders.ts` | DI abstraction for DataLoadersHandler |
| `src/operations/entry/DdbCreateEntry.ts` | create |
| `src/operations/entry/DdbCreateEntryRevisionFrom.ts` | createRevisionFrom |
| `src/operations/entry/DdbUpdateEntry.ts` | update |
| `src/operations/entry/DdbMoveEntry.ts` | move |
| `src/operations/entry/DdbMoveToBin.ts` | moveToBin |
| `src/operations/entry/DdbDeleteEntry.ts` | delete |
| `src/operations/entry/DdbRestoreFromBin.ts` | restoreFromBin |
| `src/operations/entry/DdbDeleteEntryRevision.ts` | deleteRevision |
| `src/operations/entry/DdbDeleteMultipleEntries.ts` | deleteMultipleEntries |
| `src/operations/entry/DdbGetEntry.ts` | get (delegates to ListEntriesStorageOperation) |
| `src/operations/entry/DdbListEntries.ts` | list |
| `src/operations/entry/DdbPublishEntry.ts` | publish |
| `src/operations/entry/DdbUnpublishEntry.ts` | unpublish |
| `src/operations/entry/DdbGetEntriesByIds.ts` | getByIds |
| `src/operations/entry/DdbGetLatestEntriesByIds.ts` | getLatestByIds |
| `src/operations/entry/DdbGetPublishedEntriesByIds.ts` | getPublishedByIds |
| `src/operations/entry/DdbGetRevisions.ts` | getRevisions |
| `src/operations/entry/DdbGetRevisionById.ts` | getRevisionById |
| `src/operations/entry/DdbGetLatestRevisionByEntryId.ts` | getLatestRevisionByEntryId |
| `src/operations/entry/DdbGetPublishedRevisionByEntryId.ts` | getPublishedRevisionByEntryId |
| `src/operations/entry/DdbGetPreviousRevision.ts` | getPreviousRevision |
| `src/operations/entry/DdbGetUniqueFieldValues.ts` | getUniqueFieldValues (delegates to ListEntriesStorageOperation) |
| `src/DdbEntryStorageOpsFeature.ts` | Feature with typed completeness map |

### Modified files

| File | Change |
|------|--------|
| `src/index.ts` | Register `DdbEntryStorageOpsFeature` instead of `DdbCmsEntryStorageOpsRegistrar` |
| `packages/api-headless-cms/src/HeadlessCmsFeature.ts` | Remove registrar call for entry ops |

### Deleted files

| File | Reason |
|------|--------|
| `src/DdbCmsEntryStorageOpsRegistrar.ts` | Replaced by feature |
| `src/operations/entry/index.ts` | Monolith — all methods extracted |

---

### Task 1: Create CmsDdbDataLoaders abstraction

**Files:**
- Create: `packages/api-headless-cms-ddb/src/abstractions/CmsDdbDataLoaders.ts`

**Interfaces:**
- Produces: `CmsDdbDataLoaders` abstraction token, `CmsDdbDataLoaders.Interface` type — used by all 22 DI classes that need dataloader caching

- [ ] **Step 1: Create abstraction file**

```typescript
// packages/api-headless-cms-ddb/src/abstractions/CmsDdbDataLoaders.ts
import { createAbstraction } from "@webiny/feature/api";
import type { IDataLoadersHandler } from "~/types.js";

export const CmsDdbDataLoaders = createAbstraction<IDataLoadersHandler>("Cms/Ddb/DataLoaders");

export namespace CmsDdbDataLoaders {
    export type Interface = IDataLoadersHandler;
}
```

- [ ] **Step 2: Build to verify**

```bash
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-ddb/src/abstractions/CmsDdbDataLoaders.ts
git commit -m "feat(api-headless-cms-ddb): add CmsDdbDataLoaders DI abstraction"
```

---

### Task 2: Extract DdbGetUniqueFieldValues (simplest method — no shared deps except list delegation)

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/entry/DdbGetUniqueFieldValues.ts`
- Modify: `packages/api-headless-cms-ddb/src/operations/entry/index.ts` — remove `getUniqueFieldValues` from monolith return

**Interfaces:**
- Consumes: `GetUniqueFieldValuesStorageOperation` abstraction, `ListEntriesStorageOperation` abstraction
- Produces: `DdbGetUniqueFieldValues` implementation token

Start with the simplest method to establish the pattern.

**Big-bang swap strategy:** During Tasks 2–8, DI classes are created alongside the monolith — the monolith stays intact and functional via the registrar. No intermediate wiring changes. At Task 9, the feature is created. At Task 10, the swap happens: feature replaces registrar, monolith is deleted. Testing during Tasks 2–8 uses the existing registrar path (monolith). Testing at Task 10 validates the new DI path.

- [ ] **Step 1: Create DI class**

```typescript
// packages/api-headless-cms-ddb/src/operations/entry/DdbGetUniqueFieldValues.ts
import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { aggregateUniqueFieldValues } from "@webiny/api-headless-cms-storage";

const MAX_LIST_LIMIT = 1000000;

class DdbGetUniqueFieldValuesImpl
    implements GetUniqueFieldValuesStorageOperation.Interface
{
    constructor(private listEntries: ListEntriesStorageOperation.Interface) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        const { where, fieldId } = params;

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            throw new WebinyError(
                `Could not find field with given "fieldId" value.`,
                "FIELD_NOT_FOUND",
                { fieldId }
            );
        }

        const { items } = await this.listEntries.execute(model, {
            where,
            limit: MAX_LIST_LIMIT
        });

        return aggregateUniqueFieldValues(items, field.fieldId);
    }
}

export const DdbGetUniqueFieldValues = createImplementation({
    abstraction: GetUniqueFieldValuesStorageOperation,
    implementation: DdbGetUniqueFieldValuesImpl,
    dependencies: [ListEntriesStorageOperation]
});
```

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-ddb): extract DdbGetUniqueFieldValues DI class"
```

---

### Task 3: Extract DdbGetEntry (delegates to list)

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/entry/DdbGetEntry.ts`
- Modify: `packages/api-headless-cms-ddb/src/operations/entry/index.ts` — remove `get`

**Interfaces:**
- Consumes: `GetEntryStorageOperation` abstraction, `ListEntriesStorageOperation` abstraction, `CmsStorageModelProvider`
- Produces: `DdbGetEntry` implementation token

- [ ] **Step 1: Create DI class**

```typescript
// packages/api-headless-cms-ddb/src/operations/entry/DdbGetEntry.ts
import type { CmsModel, CmsEntryValues, CmsEntryStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class DdbGetEntryImpl implements GetEntryStorageOperation.Interface {
    constructor(
        private listEntries: ListEntriesStorageOperation.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        const model = this.storageModelProvider.getModel(initialModel);

        const { items } = await this.listEntries.execute<T>(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    }
}

export const DdbGetEntry = createImplementation({
    abstraction: GetEntryStorageOperation,
    implementation: DdbGetEntryImpl,
    dependencies: [ListEntriesStorageOperation, CmsStorageModelProvider]
});
```

- [ ] **Step 2: Build and commit**

---

### Task 4: Extract shared utilities + 7 dataLoader-read methods

First extract `convertToStorageEntry` and `convertFromStorageEntry` from `operations/entry/index.ts` to a new shared utility file. Then extract the 7 dataLoader-read methods.

**Files:** Create 8 files:
- `packages/api-headless-cms-ddb/src/operations/entry/storageEntryUtils.ts` — shared `convertToStorageEntry` and `convertFromStorageEntry` functions
- `DdbGetRevisionById.ts`
- `DdbGetRevisions.ts`
- `DdbGetEntriesByIds.ts`
- `DdbGetLatestEntriesByIds.ts`
- `DdbGetPublishedEntriesByIds.ts`
- `DdbGetLatestRevisionByEntryId.ts`
- `DdbGetPublishedRevisionByEntryId.ts`

**Template for each (example: DdbGetRevisionById):**

- [ ] **Step 1: Extract shared utility functions**

Move `convertToStorageEntry` and `convertFromStorageEntry` from `operations/entry/index.ts` (lines 67–91) to a new shared file. Update the monolith to import from the new file instead of defining locally.

```typescript
// packages/api-headless-cms-ddb/src/operations/entry/storageEntryUtils.ts
import type { CmsEntryValues, CmsStorageEntry, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";

interface ConvertStorageEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    storageEntry: CmsStorageEntry<T>;
    model: StorageOperationsCmsModel<T>;
}

export const convertToStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, storageEntry } = params;
    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return { ...storageEntry, values };
};

export const convertFromStorageEntry = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
    const { model, storageEntry } = params;
    const values = model.convertValueKeyFromStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return { ...storageEntry, values };
};
```

Build and verify monolith still works after import change.

- [ ] **Step 2: Create all 7 DI classes**

Each follows this pattern (importing from shared util):

```typescript
// packages/api-headless-cms-ddb/src/operations/entry/DdbGetRevisionById.ts
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetRevisionByIdImpl implements GetRevisionByIdStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const [entry] = await this.dataLoaders.getRevisionById<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertFromStorageEntry<T>({ model, storageEntry: entry });
    }
}

export const DdbGetRevisionById = createImplementation({
    abstraction: GetRevisionByIdStorageOperation,
    implementation: DdbGetRevisionByIdImpl,
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider]
});
```

The other 6 follow the identical pattern with their respective:
- Abstraction (`GetRevisionsStorageOperation`, `GetEntriesByIdsStorageOperation`, etc.)
- DataLoader method (`getAllEntryRevisions`, `getRevisionById`, `getLatestRevisionByEntryId`, `getPublishedRevisionByEntryId`)
- Return type (single entry → `null` check; array → `.map(...)`)

**DataLoader method mapping:**
| DI Class | DataLoader method | Returns |
|----------|------------------|---------|
| DdbGetRevisionById | `getRevisionById` | single or null |
| DdbGetRevisions | `getAllEntryRevisions` | array, map each |
| DdbGetEntriesByIds | `getRevisionById` | array, map each |
| DdbGetLatestEntriesByIds | `getLatestRevisionByEntryId` | array, map each |
| DdbGetPublishedEntriesByIds | `getPublishedRevisionByEntryId` | array, map each |
| DdbGetLatestRevisionByEntryId | `getLatestRevisionByEntryId` | single or null |
| DdbGetPublishedRevisionByEntryId | `getPublishedRevisionByEntryId` | single or null |

- [ ] **Step 3: Build and commit**

---

### Task 5: Extract DdbGetPreviousRevision

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/entry/DdbGetPreviousRevision.ts`

**Interfaces:**
- Consumes: `CmsDdbEntryEntity`, `CmsStorageModelProvider`
- Produces: `DdbGetPreviousRevision` implementation token

Unique method — queries entity directly (no dataLoaders), filters by version.

- [ ] **Step 1: Create DI class**

Extract `getPreviousRevision` from monolith (lines 1273–1336 in current index.ts). Uses `entity.queryAll`, `createPartitionKey`, `convertFromStorageEntry`. Dependencies: `CmsDdbEntryEntity`, `CmsStorageModelProvider`.

- [ ] **Step 2: Build and commit**

---

### Task 6: Extract DdbListEntries (largest read method)

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts`

**Interfaces:**
- Consumes: `CmsDdbEntryEntity`, `CmsStorageModelProvider`, `StorageTransformRegistry`, plus filter/sort registries from `@webiny/api-headless-cms-storage`
- Produces: `DdbListEntries` implementation token

This is the most complex read method (~140 lines). It uses:
- `entity.queryAll` for DDB query
- `convertFromStorageEntry` for value key conversion
- `storageTransformRegistry` for field transforms
- `FieldFilterPathRegistry`, `FieldFilterValueTransformRegistry`, `FieldFilterCreateRegistry`, `FieldSortingRegistry`, `ValueFilterRegistry` for filtering/sorting
- Cursor-based pagination

- [ ] **Step 1: Create DI class**

Dependencies: `[CmsDdbEntryEntity, CmsStorageModelProvider, StorageTransformRegistry, FieldFilterPathRegistry, FieldFilterValueTransformRegistry, FieldFilterCreateRegistry, FieldSortingRegistry, ValueFilterRegistry]`

Extract lines 960–1098 from monolith. Keep `MAX_LIST_LIMIT` as module-level constant.

- [ ] **Step 2: Build and commit**

---

### Task 7: Extract DdbCreateEntry

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/entry/DdbCreateEntry.ts`

**Interfaces:**
- Consumes: `CmsDdbEntryEntity`, `CmsDdbDataLoaders`, `CmsStorageModelProvider`
- Produces: `DdbCreateEntry` implementation token

Write operations all follow similar pattern: get storage model, convert keys, batch write to entity, clear dataLoaders.

- [ ] **Step 1: Create DI class**

Extract `create` method (lines 112–182). Uses `entity.createEntityWriter`, `createEntryRevisionKeys`, `createEntryLatestKeys`, `createEntryPublishedKeys`, `convertToStorageEntry`, `dataLoaders.clearAll`.

- [ ] **Step 2: Build and commit**

---

### Task 8: Extract remaining write methods (10 methods)

**Files:** Create 10 files:
- `DdbCreateEntryRevisionFrom.ts` — lines 184–269
- `DdbUpdateEntry.ts` — lines 271–375
- `DdbMoveEntry.ts` — lines 377–429
- `DdbMoveToBin.ts` — lines 431–513
- `DdbDeleteEntry.ts` — lines 515–569
- `DdbRestoreFromBin.ts` — lines 571–656
- `DdbDeleteEntryRevision.ts` — lines 658–727
- `DdbDeleteMultipleEntries.ts` — lines 728–777
- `DdbPublishEntry.ts` — lines 1113–1265
- `DdbUnpublishEntry.ts` — lines 1267–1369

All follow the write pattern established in Task 7. Each method:
1. Gets storage model via `storageModelProvider.getModel()`
2. Converts entry keys via `convertToStorageEntry()`
3. Builds entity batch via `entity.createEntityWriter()`
4. Executes batch and clears dataLoaders

Implement all 10. Monolith stays intact. Build after all are created.

- [ ] **Step 1: Extract DdbCreateEntryRevisionFrom**
- [ ] **Step 2: Extract DdbUpdateEntry**
- [ ] **Step 3: Extract DdbMoveEntry**
- [ ] **Step 4: Extract DdbMoveToBin**
- [ ] **Step 5: Extract DdbDeleteEntry**
- [ ] **Step 6: Extract DdbRestoreFromBin**
- [ ] **Step 7: Extract DdbDeleteEntryRevision**
- [ ] **Step 8: Extract DdbDeleteMultipleEntries**
- [ ] **Step 9: Extract DdbPublishEntry**
- [ ] **Step 10: Extract DdbUnpublishEntry**
- [ ] **Step 11: Build and commit all 10**

---

### Task 9: Create DdbEntryStorageOpsFeature with typed completeness map

**Files:**
- Create: `packages/api-headless-cms-ddb/src/DdbEntryStorageOpsFeature.ts`

**Interfaces:**
- Consumes: All 22 `Ddb<Op>` implementation tokens
- Produces: `DdbEntryStorageOpsFeature` — registers all entry ops + DataLoaders

- [ ] **Step 1: Create feature file**

```typescript
// packages/api-headless-cms-ddb/src/DdbEntryStorageOpsFeature.ts
import { createFeature } from "@webiny/feature/api/index.js";
import type { Implementation, Constructor } from "@webiny/di";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { DdbCreateEntry } from "~/operations/entry/DdbCreateEntry.js";
import { DdbCreateEntryRevisionFrom } from "~/operations/entry/DdbCreateEntryRevisionFrom.js";
import { DdbUpdateEntry } from "~/operations/entry/DdbUpdateEntry.js";
import { DdbMoveEntry } from "~/operations/entry/DdbMoveEntry.js";
import { DdbMoveToBin } from "~/operations/entry/DdbMoveToBin.js";
import { DdbDeleteEntry } from "~/operations/entry/DdbDeleteEntry.js";
import { DdbRestoreFromBin } from "~/operations/entry/DdbRestoreFromBin.js";
import { DdbDeleteEntryRevision } from "~/operations/entry/DdbDeleteEntryRevision.js";
import { DdbDeleteMultipleEntries } from "~/operations/entry/DdbDeleteMultipleEntries.js";
import { DdbGetEntry } from "~/operations/entry/DdbGetEntry.js";
import { DdbListEntries } from "~/operations/entry/DdbListEntries.js";
import { DdbPublishEntry } from "~/operations/entry/DdbPublishEntry.js";
import { DdbUnpublishEntry } from "~/operations/entry/DdbUnpublishEntry.js";
import { DdbGetEntriesByIds } from "~/operations/entry/DdbGetEntriesByIds.js";
import { DdbGetLatestEntriesByIds } from "~/operations/entry/DdbGetLatestEntriesByIds.js";
import { DdbGetPublishedEntriesByIds } from "~/operations/entry/DdbGetPublishedEntriesByIds.js";
import { DdbGetRevisions } from "~/operations/entry/DdbGetRevisions.js";
import { DdbGetRevisionById } from "~/operations/entry/DdbGetRevisionById.js";
import { DdbGetLatestRevisionByEntryId } from "~/operations/entry/DdbGetLatestRevisionByEntryId.js";
import { DdbGetPublishedRevisionByEntryId } from "~/operations/entry/DdbGetPublishedRevisionByEntryId.js";
import { DdbGetPreviousRevision } from "~/operations/entry/DdbGetPreviousRevision.js";
import { DdbGetUniqueFieldValues } from "~/operations/entry/DdbGetUniqueFieldValues.js";

interface DdbEntryOpsMap {
    create: Implementation<Constructor>;
    createRevisionFrom: Implementation<Constructor>;
    update: Implementation<Constructor>;
    move: Implementation<Constructor>;
    moveToBin: Implementation<Constructor>;
    delete: Implementation<Constructor>;
    restoreFromBin: Implementation<Constructor>;
    deleteRevision: Implementation<Constructor>;
    deleteMultipleEntries: Implementation<Constructor>;
    get: Implementation<Constructor>;
    list: Implementation<Constructor>;
    publish: Implementation<Constructor>;
    unpublish: Implementation<Constructor>;
    getByIds: Implementation<Constructor>;
    getLatestByIds: Implementation<Constructor>;
    getPublishedByIds: Implementation<Constructor>;
    getRevisions: Implementation<Constructor>;
    getRevisionById: Implementation<Constructor>;
    getLatestRevisionByEntryId: Implementation<Constructor>;
    getPublishedRevisionByEntryId: Implementation<Constructor>;
    getPreviousRevision: Implementation<Constructor>;
    getUniqueFieldValues: Implementation<Constructor>;
}

const OPS: DdbEntryOpsMap = {
    create: DdbCreateEntry,
    createRevisionFrom: DdbCreateEntryRevisionFrom,
    update: DdbUpdateEntry,
    move: DdbMoveEntry,
    moveToBin: DdbMoveToBin,
    delete: DdbDeleteEntry,
    restoreFromBin: DdbRestoreFromBin,
    deleteRevision: DdbDeleteEntryRevision,
    deleteMultipleEntries: DdbDeleteMultipleEntries,
    get: DdbGetEntry,
    list: DdbListEntries,
    publish: DdbPublishEntry,
    unpublish: DdbUnpublishEntry,
    getByIds: DdbGetEntriesByIds,
    getLatestByIds: DdbGetLatestEntriesByIds,
    getPublishedByIds: DdbGetPublishedEntriesByIds,
    getRevisions: DdbGetRevisions,
    getRevisionById: DdbGetRevisionById,
    getLatestRevisionByEntryId: DdbGetLatestRevisionByEntryId,
    getPublishedRevisionByEntryId: DdbGetPublishedRevisionByEntryId,
    getPreviousRevision: DdbGetPreviousRevision,
    getUniqueFieldValues: DdbGetUniqueFieldValues
};

export const DdbEntryStorageOpsFeature = createFeature({
    name: "cms.ddb.entryStorageOps",
    register: container => {
        container.registerFactory(CmsDdbDataLoaders, () => {
            const entity = container.resolve(CmsDdbEntryEntity);
            return new DataLoadersHandler({ entity });
        });

        for (const impl of Object.values(OPS)) {
            container.register(impl);
        }
    }
});
```

- [ ] **Step 2: Build to verify types**

```bash
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

---

### Task 10: Wire feature and delete dead code

**Files:**
- Modify: `packages/api-headless-cms-ddb/src/index.ts` — replace registrar with feature
- Modify: `packages/api-headless-cms/src/HeadlessCmsFeature.ts` — remove registrar call
- Delete: `packages/api-headless-cms-ddb/src/DdbCmsEntryStorageOpsRegistrar.ts`
- Delete: `packages/api-headless-cms-ddb/src/operations/entry/index.ts`

- [ ] **Step 1: Update HeadlessCmsDdbFeature (index.ts)**

Replace:
```typescript
import { DdbCmsEntryStorageOpsRegistrar } from "~/DdbCmsEntryStorageOpsRegistrar.js";
// ...
container.register(DdbCmsEntryStorageOpsRegistrar).inSingletonScope();
```

With:
```typescript
import { DdbEntryStorageOpsFeature } from "~/DdbEntryStorageOpsFeature.js";
// ...
DdbEntryStorageOpsFeature.register(container);
```

- [ ] **Step 2: Update HeadlessCmsFeature**

Remove the entry registrar block:
```typescript
const entryRegistrar = container.resolve(CmsEntryStorageOpsRegistrar);
entryRegistrar.register(container);
```

Entry ops are now registered by the adapter feature. HeadlessCmsFeature no longer manages entry storage registration for DDB.

**Note:** Other adapters (DDB-ES, SQL, PG-OS) still use the registrar. Keep the registrar resolve + call but make it conditional — only call if registrar is registered (try/catch as before). Or better: keep it as-is until those adapters are migrated in follow-up PRs.

- [ ] **Step 3: Delete dead files**

```bash
rm packages/api-headless-cms-ddb/src/DdbCmsEntryStorageOpsRegistrar.ts
rm packages/api-headless-cms-ddb/src/operations/entry/index.ts
```

- [ ] **Step 4: Full pre-commit checks**

```bash
git add .
yarn format > /dev/null 2>&1
yarn lint 2>&1 | tail -5
yarn build -p @webiny/api-headless-cms-ddb -p @webiny/api-headless-cms 2>&1 | tail -15
yarn adio 2>&1 | tail -5
yarn webiny sync-dependencies 2>&1 | tail -3
git add .
```

- [ ] **Step 5: Run full DDB test suite**

```bash
yarn test packages/api-headless-cms --shard=1/64 2>&1 | tail -15
yarn test packages/api-headless-cms --shard=2/64 2>&1 | tail -15
# Continue through shards until confident (at least 4-8 shards)
```

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor(api-headless-cms-ddb): wire DdbEntryStorageOpsFeature, delete registrar and monolith"
```
