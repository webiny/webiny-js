# CMS Storage Operations DI Split

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolithic `StorageOperations` DI abstraction into per-type (group, model) and per-method (entry) DI abstractions, and provide a type-safe registration helper that enforces storage adapters register every required method.

**Architecture:** New abstractions live in `features/shared/storageOperations/`. Group and model get one abstraction each (small surface). Entry gets one abstraction per method (22 methods = 22 abstractions). A `ICmsStorageOperationsRegistry` interface defines the required shape; a `registerCmsStorageOperations(container, registry)` helper registers all per-method abstractions from it. Each task below is one abstraction + its consumer migration, so tasks can be parallelized by independent agents.

**Tech Stack:** `@webiny/di` (Abstraction, createAbstraction, createImplementation), `@webiny/feature/api` (createFeature)

## Global Constraints

- One abstraction per file, one implementation per file
- Impl files use class name, not "implementation.ts"; export name matches abstraction
- Use namespace types for `Interface` export
- Only export what external consumers need
- Extract inline type definitions to named interfaces

---

## Consumer map (repository file to storage method)

| Repository file | Storage method |
|---|---|
| CreateGroupRepository | `groups.create` |
| DeleteGroupRepository | `groups.delete` |
| GetGroupRepository | `groups.get` |
| ListGroupsRepository | `groups.list` |
| UpdateGroupRepository | `groups.update` |
| CreateModelRepository | `models.create` |
| CreateModelFromRepository | `models.create` |
| DeleteModelRepository | `models.delete` |
| UpdateModelRepository | `models.update` |
| ModelsFetcher | `models.list` |
| CreateEntryRepository | `entries.create` |
| CreateEntryRevisionFromRepository | `entries.createRevisionFrom` |
| UpdateEntryRepository | `entries.update` |
| DeleteEntryRepository | `entries.delete` |
| MoveEntryToBinRepository | `entries.moveToBin` |
| DeleteEntryRevisionRepository | `entries.deleteRevision` |
| DeleteMultipleEntriesRepository | `entries.deleteMultipleEntries` |
| MoveEntryRepository | `entries.move` |
| PublishEntryRepository | `entries.publish` |
| RepublishEntryRepository | `entries.publish` + `entries.update` |
| UnpublishEntryRepository | `entries.unpublish` |
| RestoreEntryFromBinRepository | `entries.restoreFromBin` |
| ListEntriesRepository | `entries.list` |
| GetEntriesByIdsRepository | `entries.getByIds` |
| GetLatestEntriesByIdsRepository | `entries.getLatestByIds` |
| GetPublishedEntriesByIdsRepository | `entries.getPublishedByIds` |
| GetRevisionsByEntryIdRepository | `entries.getRevisions` |
| GetRevisionByIdRepository | `entries.getRevisionById` |
| GetLatestRevisionByEntryIdRepository | `entries.getLatestRevisionByEntryId` |
| GetPublishedRevisionByEntryIdRepository | `entries.getPublishedRevisionByEntryId` |
| GetPreviousRevisionByEntryIdRepository | `entries.getPreviousRevision` |
| GetUniqueFieldValuesRepository | `entries.getUniqueFieldValues` |
| ForceDeleteDecorator | `entries.delete` |
| *(no consumer)* | `entries.get` |

---

## Migration pattern (all tasks follow this)

Each task below creates one abstraction and migrates its consumer(s). The pattern for consumer migration:

```typescript
// 1. Replace import
// Before:
import { StorageOperations } from "~/features/shared/abstractions.js";
// After:
import { XxxStorageOperation } from "~/features/shared/storageOperations/entry/XxxStorageOperation.js";

// 2. Change constructor param
// Before:
private storageOperations: StorageOperations.Interface,
// After:
private xxxStorage: XxxStorageOperation.Interface,

// 3. Change call site
// Before:
this.storageOperations.entries.xxx(model, params)
// After:
this.xxxStorage.execute(model, params)

// 4. Update dependencies array
// Before:
dependencies: [..., StorageOperations, ...]
// After:
dependencies: [..., XxxStorageOperation, ...]
```

For group/model consumers, no `.execute()` wrapper — the abstraction IS the `CmsGroupStorageOperations`/`CmsModelStorageOperations` interface:

```typescript
// Before:
this.storageOperations.groups.list(...)
// After:
this.groupStorageOperations.list(...)
```

---

### Task 1: GroupStorageOperations — abstraction + migrate 5 consumers

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/GroupStorageOperations.ts`
- Modify: `packages/api-headless-cms/src/features/contentModelGroup/CreateGroup/CreateGroupRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModelGroup/DeleteGroup/DeleteGroupRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModelGroup/GetGroup/GetGroupRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModelGroup/ListGroups/ListGroupsRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModelGroup/UpdateGroup/UpdateGroupRepository.ts`

- [ ] **Step 1: Create abstraction**

```typescript
// packages/api-headless-cms/src/features/shared/storageOperations/GroupStorageOperations.ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroupStorageOperations } from "~/types/types.js";

export const GroupStorageOperations =
    createAbstraction<CmsGroupStorageOperations>("Cms/GroupStorageOperations");

export namespace GroupStorageOperations {
    export type Interface = CmsGroupStorageOperations;
}
```

- [ ] **Step 2: Migrate all 5 group repositories**

Each file: replace `StorageOperations` import with `GroupStorageOperations`, change constructor param from `StorageOperations.Interface` to `GroupStorageOperations.Interface`, remove `.groups` accessor from all call sites, update `dependencies` array.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms/src/features/shared/storageOperations/GroupStorageOperations.ts
git add packages/api-headless-cms/src/features/contentModelGroup/
git commit -m "feat(api-headless-cms): add GroupStorageOperations abstraction and migrate consumers"
```

---

### Task 2: ModelStorageOperations — abstraction + migrate 5 consumers

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/ModelStorageOperations.ts`
- Modify: `packages/api-headless-cms/src/features/contentModel/CreateModel/CreateModelRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModel/CreateModelFrom/CreateModelFromRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModel/DeleteModel/DeleteModelRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModel/UpdateModel/UpdateModelRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentModel/shared/ModelsFetcher.ts`

- [ ] **Step 1: Create abstraction**

```typescript
// packages/api-headless-cms/src/features/shared/storageOperations/ModelStorageOperations.ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelStorageOperations } from "~/types/types.js";

export const ModelStorageOperations =
    createAbstraction<CmsModelStorageOperations>("Cms/ModelStorageOperations");

export namespace ModelStorageOperations {
    export type Interface = CmsModelStorageOperations;
}
```

- [ ] **Step 2: Migrate all 5 model repositories**

Each file: replace `StorageOperations` import with `ModelStorageOperations`, change constructor param, remove `.models` accessor, update `dependencies` array.

Note: `CreateModelRepository.ts` and `CreateModelFromRepository.ts` also import `CmsContext` from shared abstractions — that import stays.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms/src/features/shared/storageOperations/ModelStorageOperations.ts
git add packages/api-headless-cms/src/features/contentModel/
git commit -m "feat(api-headless-cms): add ModelStorageOperations abstraction and migrate consumers"
```

---

### Task 3: CreateEntryStorageOperation — abstraction + migrate CreateEntryRepository

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/CreateEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryRepository.ts`

- [ ] **Step 1: Create abstraction**

```typescript
// packages/api-headless-cms/src/features/shared/storageOperations/entry/CreateEntryStorageOperation.ts
import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryValues,
    CmsModel
} from "~/types/types.js";

export interface ICreateEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>>;
}

export const CreateEntryStorageOperation =
    createAbstraction<ICreateEntryStorageOperation>("Cms/Entry/CreateStorageOperation");

export namespace CreateEntryStorageOperation {
    export type Interface = ICreateEntryStorageOperation;
}
```

- [ ] **Step 2: Migrate CreateEntryRepository**

Apply migration pattern. `this.storageOperations.entries.create(model, params)` becomes `this.createEntryStorage.execute(model, params)`.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms/src/features/shared/storageOperations/entry/CreateEntryStorageOperation.ts
git add packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryRepository.ts
git commit -m "feat(api-headless-cms): add CreateEntryStorageOperation and migrate consumer"
```

---

### Task 4: CreateEntryRevisionFromStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromRepository.ts`

- [ ] **Step 1: Create abstraction**

Interface wraps `entries.createRevisionFrom` signature from `CmsEntryStorageOperations`.

- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 5: UpdateEntryStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/UpdateEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryRepository.ts`

- [ ] **Step 1: Create abstraction**

Interface wraps `entries.update` signature.

- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 6: DeleteEntryStorageOperation — abstraction + migrate 2 consumers

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/DeleteEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntry/DeleteEntryRepository.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntry/decorators/ForceDeleteDecorator.ts`

- [ ] **Step 1: Create abstraction**

Interface wraps `entries.delete` signature.

- [ ] **Step 2: Migrate both consumers**

Both `DeleteEntryRepository` and `ForceDeleteDecorator` use only `entries.delete`.

- [ ] **Step 3: Commit**

---

### Task 7: DeleteEntryRevisionStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntryRevision/DeleteEntryRevisionRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 8: DeleteMultipleEntriesStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteMultipleEntries/DeleteMultipleEntriesRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 9: MoveToBinStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/MoveToBinStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntry/MoveEntryToBinRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 10: RestoreFromBinStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/RestoreEntryFromBin/RestoreEntryFromBinRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 11: PublishEntryStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/PublishEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/PublishEntry/PublishEntryRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 12: UnpublishEntryStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/UnpublishEntry/UnpublishEntryRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 13: MoveEntryStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/MoveEntryStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/MoveEntry/MoveEntryRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 14: GetEntryStorageOperation — abstraction only (no consumer)

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetEntryStorageOperation.ts`

No repository consumes `entries.get` directly — `GetEntry` composes other use cases. Abstraction needed for registry completeness.

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Commit**

---

### Task 15: ListEntriesStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/ListEntriesStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/ListEntries/ListEntriesRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 16: GetEntriesByIdsStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetEntriesByIds/GetEntriesByIdsRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 17: GetLatestEntriesByIdsStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetLatestEntriesByIds/GetLatestEntriesByIdsRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 18: GetPublishedEntriesByIdsStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetPublishedEntriesByIds/GetPublishedEntriesByIdsRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 19: GetRevisionsStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetRevisionsStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetRevisionsByEntryId/GetRevisionsByEntryIdRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 20: GetRevisionByIdStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetRevisionById/GetRevisionByIdRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 21: GetPublishedRevisionByEntryIdStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetPublishedRevisionByEntryId/GetPublishedRevisionByEntryIdRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 22: GetLatestRevisionByEntryIdStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetLatestRevisionByEntryId/GetLatestRevisionByEntryIdRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 23: GetPreviousRevisionStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetPreviousRevisionByEntryId/GetPreviousRevisionByEntryIdRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 24: GetUniqueFieldValuesStorageOperation — abstraction + migrate

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/GetUniqueFieldValues/GetUniqueFieldValuesRepository.ts`

- [ ] **Step 1: Create abstraction**
- [ ] **Step 2: Migrate consumer**
- [ ] **Step 3: Commit**

---

### Task 25: RepublishEntryRepository — migrate to two abstractions

Depends on Tasks 5 (UpdateEntryStorageOperation) and 11 (PublishEntryStorageOperation) being done first.

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/RepublishEntry/RepublishEntryRepository.ts`

- [ ] **Step 1: Migrate — replace StorageOperations with both PublishEntryStorageOperation + UpdateEntryStorageOperation**

```typescript
import { PublishEntryStorageOperation } from "~/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";

// Constructor:
private publishEntryStorage: PublishEntryStorageOperation.Interface,
private updateEntryStorage: UpdateEntryStorageOperation.Interface,

// Dependencies:
dependencies: [..., PublishEntryStorageOperation, UpdateEntryStorageOperation, ...]
```

- [ ] **Step 2: Commit**

---

### Task 26: Registration helper + barrel export

After all abstractions exist, create the type-safe registration helper.

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/registerCmsStorageOperations.ts`
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/index.ts`
- Modify: `packages/api-headless-cms/src/exports/api/cms/storage.ts` — re-export helper

- [ ] **Step 1: Create ICmsStorageOperationsRegistry + registerCmsStorageOperations**

`ICmsStorageOperationsRegistry` is a plain object type with required keys for `groups` (`CmsGroupStorageOperations`), `models` (`CmsModelStorageOperations`), and `entries` (object with all 22 per-method interfaces). TypeScript enforces completeness at call sites.

`registerCmsStorageOperations(container, registry)` calls `container.registerInstance(...)` for each of the 24 abstractions.

```typescript
export interface ICmsStorageOperationsRegistry {
    groups: CmsGroupStorageOperations;
    models: CmsModelStorageOperations;
    entries: {
        create: ICreateEntryStorageOperation;
        createRevisionFrom: ICreateEntryRevisionFromStorageOperation;
        update: IUpdateEntryStorageOperation;
        delete: IDeleteEntryStorageOperation;
        deleteRevision: IDeleteEntryRevisionStorageOperation;
        deleteMultipleEntries: IDeleteMultipleEntriesStorageOperation;
        moveToBin: IMoveToBinStorageOperation;
        restoreFromBin: IRestoreFromBinStorageOperation;
        publish: IPublishEntryStorageOperation;
        unpublish: IUnpublishEntryStorageOperation;
        move: IMoveEntryStorageOperation;
        get: IGetEntryStorageOperation;
        list: IListEntriesStorageOperation;
        getByIds: IGetEntriesByIdsStorageOperation;
        getLatestByIds: IGetLatestEntriesByIdsStorageOperation;
        getPublishedByIds: IGetPublishedEntriesByIdsStorageOperation;
        getRevisions: IGetRevisionsStorageOperation;
        getRevisionById: IGetRevisionByIdStorageOperation;
        getPublishedRevisionByEntryId: IGetPublishedRevisionByEntryIdStorageOperation;
        getLatestRevisionByEntryId: IGetLatestRevisionByEntryIdStorageOperation;
        getPreviousRevision: IGetPreviousRevisionStorageOperation;
        getUniqueFieldValues: IGetUniqueFieldValuesStorageOperation;
    };
}
```

- [ ] **Step 2: Create barrel export index.ts**

Export all abstractions and the registration helper.

- [ ] **Step 3: Add re-export in storage.ts**

```typescript
export { registerCmsStorageOperations } from "~/features/shared/storageOperations/registerCmsStorageOperations.js";
export type { ICmsStorageOperationsRegistry } from "~/features/shared/storageOperations/registerCmsStorageOperations.js";
```

- [ ] **Step 4: Commit**

---

### Task 27: Bridge in HeadlessCmsFeature

Register all new abstractions from existing `storageOperations` object so both old and new consumers work during migration.

**Files:**
- Modify: `packages/api-headless-cms/src/HeadlessCmsFeature.ts:219-221`

- [ ] **Step 1: After line 221, call registerCmsStorageOperations**

```typescript
import { registerCmsStorageOperations } from "~/features/shared/storageOperations/registerCmsStorageOperations.js";

// After: container.registerInstance(StorageOperations, storageOperations);
registerCmsStorageOperations(container, {
    groups: storageOperations.groups,
    models: storageOperations.models,
    entries: {
        create: { execute: storageOperations.entries.create },
        createRevisionFrom: { execute: storageOperations.entries.createRevisionFrom },
        update: { execute: storageOperations.entries.update },
        delete: { execute: storageOperations.entries.delete },
        deleteRevision: { execute: storageOperations.entries.deleteRevision },
        deleteMultipleEntries: { execute: storageOperations.entries.deleteMultipleEntries },
        moveToBin: { execute: storageOperations.entries.moveToBin },
        restoreFromBin: { execute: storageOperations.entries.restoreFromBin },
        publish: { execute: storageOperations.entries.publish },
        unpublish: { execute: storageOperations.entries.unpublish },
        move: { execute: storageOperations.entries.move },
        get: { execute: storageOperations.entries.get },
        list: { execute: storageOperations.entries.list },
        getByIds: { execute: storageOperations.entries.getByIds },
        getLatestByIds: { execute: storageOperations.entries.getLatestByIds },
        getPublishedByIds: { execute: storageOperations.entries.getPublishedByIds },
        getRevisions: { execute: storageOperations.entries.getRevisions },
        getRevisionById: { execute: storageOperations.entries.getRevisionById },
        getPublishedRevisionByEntryId: { execute: storageOperations.entries.getPublishedRevisionByEntryId },
        getLatestRevisionByEntryId: { execute: storageOperations.entries.getLatestRevisionByEntryId },
        getPreviousRevision: { execute: storageOperations.entries.getPreviousRevision },
        getUniqueFieldValues: { execute: storageOperations.entries.getUniqueFieldValues }
    }
});
```

- [ ] **Step 2: Build and verify**

```bash
yarn build -p @webiny/api-headless-cms 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

---

### Task 28: Remove legacy StorageOperations

After all consumers migrated.

**Files:**
- Modify: `packages/api-headless-cms/src/features/shared/abstractions.ts` — remove `StorageOperations` + namespace
- Modify: `packages/api-headless-cms/src/HeadlessCmsFeature.ts` — remove `container.registerInstance(StorageOperations, storageOperations)` and import

- [ ] **Step 1: Verify no remaining consumers**

```bash
grep -rn "from.*features/shared/abstractions" packages/api-headless-cms/src/ --include="*.ts" | grep "StorageOperations" | grep -v "StorageOperationsFactory\|StorageModelProvider"
```

Expected: only `HeadlessCmsFeature.ts`.

- [ ] **Step 2: Remove from abstractions.ts and HeadlessCmsFeature.ts**
- [ ] **Step 3: Build + test**

```bash
yarn build -p @webiny/api-headless-cms 2>&1 | tail -30
yarn test packages/api-headless-cms 2>&1 | tail -50
```

- [ ] **Step 4: Commit**

---

## Task dependencies

```
Tasks 1-24: fully independent, can run in parallel
Task 25: depends on Tasks 5 + 11 (needs both abstractions to exist)
Task 26: depends on Tasks 1-24 (needs all abstractions to import)
Task 27: depends on Task 26 (needs registration helper)
Task 28: depends on all above (final cleanup)
```

## Execution order for subagent-driven development

**Batch 1 (parallel):** Tasks 1-24 (each agent creates one abstraction + migrates consumer)
**Batch 2 (sequential):** Task 25, then Task 26, then Task 27
**Batch 3:** Task 28 (cleanup)

---

### Future (out of scope): Migrate storage adapters

Each adapter (ddb, ddb-es, sql, pg-os) can later be refactored to use `registerCmsStorageOperations(container, { ... })` instead of returning a `HeadlessCmsStorageOperations` object, eventually removing the `HeadlessCmsStorageOperations` interface and `StorageOperationsFactory`.
