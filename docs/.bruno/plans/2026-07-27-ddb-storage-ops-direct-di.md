# DDB Storage Operations — Direct DI Registration (No Factory)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `api-headless-cms-ddb` from factory-based storage operations to direct DI registration — group and model operations become proper DI classes registered at feature time. Entry operations use a focused per-request registrar (replacing the monolithic `StorageOperationsFactory`). No `beforeInit`.

**Architecture:** Infrastructure (table, entities) become DI abstractions registered as instances on the root container. Group and model storage operations become DI implementation classes registered at feature time (they have no request-scoped deps — entity + FilterUtil are app-scoped). Entry operations require request-scoped state (`CmsStorageModelProvider`, `StorageTransformRegistry`) so they use a lightweight `CmsEntryStorageOpsRegistrar` abstraction — the adapter registers its implementation at feature time, and `HeadlessCmsFeature` calls `registrar.register(requestContainer)` per-request to wire up the 22 entry abstractions. This replaces the full `StorageOperationsFactory` (which created groups+models+entries) with a focused entry-only mechanism. Container-per-request makes singletons request-scoped, eliminating `beforeInit`.

**Tech Stack:** `@webiny/di` (Container), `@webiny/feature/api` (createAbstraction, createImplementation, createFeature)

## Global Constraints

- One abstraction per file, one implementation per file
- Impl files use class name; export name matches abstraction; namespace `Interface` export
- Only export what external consumers need
- Dependencies array must match constructor parameter order

---

## Current flow (being replaced)

```
HeadlessCmsDdbFeature.register(container)
  → registers DynamoDbStorageOperationsFactory (a DI class)

HeadlessCmsFeature.register(container, config)
  → at request time:
  → storageOperations = container.resolve(StorageOperationsFactory).create(context)
  → storageOperations.beforeInit(context)     // clears data loaders
  → registerCmsStorageOperations(container, { groups: storageOperations.groups, ... })
```

## Target flow

```
HeadlessCmsDdbFeature.register(rootContainer)
  → creates table + entities as DI instances (app-scoped)
  → registers DdbGroupStorageOperations → GroupStorageOperations (singleton, app-scoped)
  → registers DdbModelStorageOperations → ModelStorageOperations (singleton, app-scoped)
  → registers DdbCmsEntryStorageOpsRegistrar → CmsEntryStorageOpsRegistrar

HeadlessCmsFeature.register(requestContainer, config)
  → groups/models already available (inherited from root)
  → const registrar = container.resolve(CmsEntryStorageOpsRegistrar)
  → registrar.register(requestContainer)  // creates entry ops with request-scoped deps
  → no StorageOperationsFactory, no beforeInit
```

**Why entries can't be app-scoped:** `createEntriesStorageOperations` captures the container ref and lazily resolves `CmsStorageModelProvider` and `StorageTransformRegistry` from it. These are registered on the request container. Root-scoped entry ops can't see child container registrations (DI resolution walks child→parent, not parent→child).

---

### Task 1: Create DDB infrastructure abstractions

Create DI abstractions for the table and entity instances that DDB storage operations depend on.

**Files:**
- Create: `packages/api-headless-cms-ddb/src/abstractions/CmsDdbTable.ts`
- Create: `packages/api-headless-cms-ddb/src/abstractions/CmsDdbGroupEntity.ts`
- Create: `packages/api-headless-cms-ddb/src/abstractions/CmsDdbModelEntity.ts`
- Create: `packages/api-headless-cms-ddb/src/abstractions/CmsDdbEntryEntity.ts`

**Interfaces:**
- Produces: `CmsDdbTable`, `CmsDdbGroupEntity`, `CmsDdbModelEntity`, `CmsDdbEntryEntity` abstractions

- [ ] **Step 1: Create abstractions**

```typescript
// packages/api-headless-cms-ddb/src/abstractions/CmsDdbTable.ts
import { createAbstraction } from "@webiny/feature/api";
import type { ITable } from "@webiny/db-dynamodb";

export const CmsDdbTable = createAbstraction<ITable>("Cms/Ddb/Table");

export namespace CmsDdbTable {
    export type Interface = ITable;
}
```

```typescript
// packages/api-headless-cms-ddb/src/abstractions/CmsDdbGroupEntity.ts
import { createAbstraction } from "@webiny/feature/api";
import type { IGroupEntity } from "~/definitions/types.js";

export const CmsDdbGroupEntity = createAbstraction<IGroupEntity>("Cms/Ddb/GroupEntity");

export namespace CmsDdbGroupEntity {
    export type Interface = IGroupEntity;
}
```

Same pattern for `CmsDdbModelEntity` (typed to `IModelEntity`) and `CmsDdbEntryEntity` (typed to `IEntryEntity`).

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-ddb/src/abstractions/
git commit -m "feat(api-headless-cms-ddb): add DDB infrastructure DI abstractions"
```

---

### Task 2: Create DdbGroupStorageOperations DI implementation

Convert the `createGroupsStorageOperations` function into a proper DI class.

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/group/DdbGroupStorageOperations.ts`

**Interfaces:**
- Consumes: `CmsDdbGroupEntity`, `FilterUtil` from `@webiny/db-dynamodb`
- Produces: DI implementation for `GroupStorageOperations`

- [ ] **Step 1: Create implementation class**

The class implements `CmsGroupStorageOperations` and receives `IGroupEntity` + `FilterUtil` via constructor. All the key-creation helpers (`createPartitionKey`, `createKeys`, etc.) stay in the same file as private methods or module-level functions. The `createImplementation` call wires it to `GroupStorageOperations` abstraction.

```typescript
// packages/api-headless-cms-ddb/src/operations/group/DdbGroupStorageOperations.ts
import { createImplementation } from "@webiny/feature/api";
import { GroupStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/GroupStorageOperations.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { FilterUtil } from "@webiny/db-dynamodb/feature/FilterUtil/index.js";
import type {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { sortItems } from "@webiny/db-dynamodb";
import type { IGroupEntity } from "~/definitions/types.js";

// Key helpers (same as existing, moved here)
// ... createPartitionKey, createSortKeys, createKeys, createType ...

class DdbGroupStorageOperationsImpl implements CmsGroupStorageOperations {
    private readonly entity: IGroupEntity;
    private readonly filterUtil: FilterUtil.Interface;

    constructor(entity: CmsDdbGroupEntity.Interface, filterUtil: FilterUtil.Interface) {
        this.entity = entity;
        this.filterUtil = filterUtil;
    }

    async get(params: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> {
        // Same logic as existing createGroupsStorageOperations.get
    }

    async list(params: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> {
        // Same logic as existing
    }

    async create(params: CmsGroupStorageOperationsCreateParams): Promise<void> {
        // Same logic
    }

    async update(params: CmsGroupStorageOperationsUpdateParams): Promise<void> {
        // Same logic
    }

    async delete(params: CmsGroupStorageOperationsDeleteParams): Promise<void> {
        // Same logic
    }
}

export const DdbGroupStorageOperations = createImplementation({
    abstraction: GroupStorageOperations,
    implementation: DdbGroupStorageOperationsImpl,
    dependencies: [CmsDdbGroupEntity, FilterUtil]
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-ddb/src/operations/group/DdbGroupStorageOperations.ts
git commit -m "feat(api-headless-cms-ddb): add DdbGroupStorageOperations DI implementation"
```

---

### Task 3: Create DdbModelStorageOperations DI implementation

**Files:**
- Create: `packages/api-headless-cms-ddb/src/operations/model/DdbModelStorageOperations.ts`

**Interfaces:**
- Consumes: `CmsDdbModelEntity`
- Produces: DI implementation for `ModelStorageOperations`

- [ ] **Step 1: Create implementation class**

Same pattern as Task 2. Model operations only depend on `IModelEntity` (no FilterUtil needed — the DDB model ops don't filter client-side).

```typescript
export const DdbModelStorageOperations = createImplementation({
    abstraction: ModelStorageOperations,
    implementation: DdbModelStorageOperationsImpl,
    dependencies: [CmsDdbModelEntity]
});
```

- [ ] **Step 2: Commit**

---

### Task 4: Create CmsEntryStorageOpsRegistrar abstraction + DDB implementation

Entry operations need request-scoped deps (`CmsStorageModelProvider`, `StorageTransformRegistry`), so they can't be created at feature registration time (root container). Instead, the adapter registers a lightweight registrar that `HeadlessCmsFeature` calls per-request.

**Files:**
- Create: `packages/api-headless-cms/src/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.ts`
- Create: `packages/api-headless-cms-ddb/src/DdbCmsEntryStorageOpsRegistrar.ts`

**Interfaces:**
- Produces: `CmsEntryStorageOpsRegistrar` abstraction, `DdbCmsEntryStorageOpsRegistrar` implementation

- [ ] **Step 1: Create abstraction in api-headless-cms**

```typescript
// packages/api-headless-cms/src/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.ts
import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";

export interface ICmsEntryStorageOpsRegistrar {
    register(container: Container): void;
}

export const CmsEntryStorageOpsRegistrar =
    createAbstraction<ICmsEntryStorageOpsRegistrar>("Cms/EntryStorageOpsRegistrar");

export namespace CmsEntryStorageOpsRegistrar {
    export type Interface = ICmsEntryStorageOpsRegistrar;
}
```

- [ ] **Step 2: Create `registerCmsEntryStorageOperations` helper in core package**

Create: `packages/api-headless-cms/src/features/shared/storageOperations/registerCmsEntryStorageOperations.ts`

This function takes a `Container` and a `CmsEntryStorageOperations` object (the existing interface), wraps each method as `{ execute: ... }`, and registers all 22 entry abstractions. Extracted from the entries portion of `registerCmsStorageOperations`.

```typescript
// packages/api-headless-cms/src/features/shared/storageOperations/registerCmsEntryStorageOperations.ts
import type { Container } from "@webiny/di";
import type { CmsEntryStorageOperations } from "~/types/index.js";
// ... import all 22 entry abstraction constants ...

export const registerCmsEntryStorageOperations = (
    container: Container,
    entries: CmsEntryStorageOperations
): void => {
    container.registerInstance(CreateEntryStorageOperation, { execute: entries.create });
    container.registerInstance(CreateEntryRevisionFromStorageOperation, { execute: entries.createRevisionFrom });
    // ... all 22 registrations ...
};
```

Also re-export from `packages/api-headless-cms/src/features/shared/storageOperations/index.ts` barrel and `packages/api-headless-cms/src/exports/api/cms/storage.ts`.

- [ ] **Step 3: Create DDB implementation**

Create: `packages/api-headless-cms-ddb/src/DdbCmsEntryStorageOpsRegistrar.ts`

```typescript
import { createImplementation } from "@webiny/feature/api";
import { CmsEntryStorageOpsRegistrar } from "@webiny/api-headless-cms/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { registerCmsEntryStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/registerCmsEntryStorageOperations.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import type { Container } from "@webiny/di";
import type { IEntryEntity } from "~/definitions/types.js";

class DdbCmsEntryStorageOpsRegistrarImpl implements CmsEntryStorageOpsRegistrar.Interface {
    constructor(private entryEntity: CmsDdbEntryEntity.Interface) {}

    register(container: Container): void {
        const entries = createEntriesStorageOperations({
            entity: this.entryEntity,
            container
        });

        registerCmsEntryStorageOperations(container, entries);
    }
}

export const DdbCmsEntryStorageOpsRegistrar = createImplementation({
    abstraction: CmsEntryStorageOpsRegistrar,
    implementation: DdbCmsEntryStorageOpsRegistrarImpl,
    dependencies: [CmsDdbEntryEntity]
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms/src/features/shared/storageOperations/CmsEntryStorageOpsRegistrar.ts
git add packages/api-headless-cms/src/features/shared/storageOperations/registerCmsEntryStorageOperations.ts
git add packages/api-headless-cms/src/features/shared/storageOperations/index.ts
git add packages/api-headless-cms/src/exports/api/cms/storage.ts
git add packages/api-headless-cms-ddb/src/DdbCmsEntryStorageOpsRegistrar.ts
git commit -m "feat(api-headless-cms, api-headless-cms-ddb): add entry storage ops registrar"
```

---

### Task 5: Rewire HeadlessCmsDdbFeature to register directly

**Files:**
- Modify: `packages/api-headless-cms-ddb/src/index.ts`

**Interfaces:**
- Consumes: infrastructure abstractions (Task 1), DI implementations (Tasks 2-3), registrar (Task 4)
- Produces: `HeadlessCmsDdbFeature` that registers groups/models at feature time and entry registrar for per-request use

- [ ] **Step 1: Rewrite HeadlessCmsDdbFeature.register**

```typescript
import { FilterUtilFeature } from "@webiny/db-dynamodb/feature/FilterUtil/feature.js";

export const HeadlessCmsDdbFeature = createFeature({
    name: "cms.storageOperations.ddb",
    register: container => {
        FilterRegistriesFeature.register(container);
        FilterUtilFeature.register(container);

        const db = container.resolve(DynamoDBClient);
        const documentClient = db.client;

        const tableInstance = createTable({ documentClient });

        // Register infrastructure instances (app-scoped)
        container.registerInstance(CmsDdbTable, tableInstance);
        container.registerInstance(CmsDdbGroupEntity, createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance
        }));
        container.registerInstance(CmsDdbModelEntity, createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance
        }));
        container.registerInstance(CmsDdbEntryEntity, createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance
        }));

        // Group + model: DI classes, app-scoped singletons
        container.register(DdbGroupStorageOperations).inSingletonScope();
        container.register(DdbModelStorageOperations).inSingletonScope();

        // Entry registrar: app-scoped, called per-request by HeadlessCmsFeature
        container.register(DdbCmsEntryStorageOpsRegistrar).inSingletonScope();
    }
});
```

Remove: `DynamoDbStorageOperationsFactoryImpl`, `DynamoDbStorageOperationsFactory`, `createDynamoDbStorageOperations`.

Keep: `registerDynamoDbStorageOperations` (deprecated wrapper) — update it to call the new feature.

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-ddb/src/
git commit -m "refactor(api-headless-cms-ddb): register storage operations directly via DI"
```

---

### Task 6: Replace StorageOperationsFactory with registrar in HeadlessCmsFeature

**Files:**
- Modify: `packages/api-headless-cms/src/HeadlessCmsFeature.ts`
- Modify: `packages/api-headless-cms/src/features/shared/abstractions.ts` — remove `StorageOperationsFactory`
- Modify: `packages/api-headless-cms/src/exports/api/cms/storage.ts` — remove `StorageOperationsFactory` export
- Modify: `packages/api-headless-cms/src/types/types.ts` — remove `storageOperations` field from `HeadlessCms` interface

**Interfaces:**
- Consumes: `CmsEntryStorageOpsRegistrar` (Task 4), group/model abstractions already in container
- Produces: `HeadlessCmsFeature` that uses registrar for entries, no factory

- [ ] **Step 1: Replace factory usage in HeadlessCmsFeature**

Replace these lines (~219-258):
```typescript
// REMOVE:
const storageOperations = container.resolve(StorageOperationsFactory).create(cmsContext);
storageOperations.beforeInit(cmsContext);
registerCmsStorageOperations(container, { ... });

// REPLACE WITH:
const entryRegistrar = container.resolve(CmsEntryStorageOpsRegistrar);
entryRegistrar.register(container);
```

Groups/models are already in the container (inherited from root, registered by adapter feature). Only entry abstractions need per-request registration.

- [ ] **Step 2: Remove `storageOperations` from HeadlessCms facade**

Line ~300 builds the facade with `storageOperations` field. Remove it. The `HeadlessCms` interface in `types.ts` needs the field removed too. Only tests use `context.cms.storageOperations` — they should resolve per-method abstractions from the container instead.

- [ ] **Step 3: Remove StorageOperationsFactory from shared abstractions**

In `packages/api-headless-cms/src/features/shared/abstractions.ts`, remove:
- `StorageOperationsFactory` abstraction + namespace
- `IHeadlessCmsStorageOperationsFactory` interface

In `packages/api-headless-cms/src/exports/api/cms/storage.ts`, remove:
- `StorageOperationsFactory` re-export

Also remove `storageOperations?: IHeadlessCmsStorageOperationsFactory<any>` from the HeadlessCmsFeature config interface (line ~91).

- [ ] **Step 4: Build and test**

```bash
yarn build -p @webiny/api-headless-cms 2>&1 | tail -30
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -30
yarn test packages/api-headless-cms 2>&1 | tail -50
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms/
git commit -m "refactor(api-headless-cms): remove StorageOperationsFactory, storage ops pre-registered by adapter"
```

---

### Task 7: Clean up dead code

**Files:**
- Modify: `packages/api-headless-cms-ddb/src/types.ts` — remove `StorageOperationsFactory`, `HeadlessCmsStorageOperations` (with `getTable`/`getEntities`), and `StorageOperationsFactoryParams`
- Delete (or gut): `packages/api-headless-cms-ddb/src/operations/group/index.ts` — old `createGroupsStorageOperations` (replaced by DI class)
- Delete (or gut): `packages/api-headless-cms-ddb/src/operations/model/index.ts` — old `createModelsStorageOperations` (replaced by DI class)

- [ ] **Step 1: Remove dead types and old factory functions**
- [ ] **Step 2: Build and verify**
- [ ] **Step 3: Commit**

```bash
git commit -m "chore(api-headless-cms-ddb): remove dead factory code and types"
```

---

## Task dependencies

```
Task 1: independent (infrastructure abstractions)
Task 2: depends on Task 1 (needs CmsDdbGroupEntity)
Task 3: depends on Task 1 (needs CmsDdbModelEntity)
Task 4: depends on Task 1 (needs CmsDdbEntryEntity) — creates registrar abstraction + DDB impl
Task 5: depends on Tasks 1-4 (rewires HeadlessCmsDdbFeature)
Task 6: depends on Task 5 (replaces factory in HeadlessCmsFeature with registrar)
Task 7: depends on Task 6 (dead code cleanup)
```

## What's NOT in scope

- Converting entry operations to per-method DI classes (future — entries stay as `createEntriesStorageOperations` function, wrapped by the registrar)
- Other adapters (ddb-es, sql, pg-os) — each gets its own plan after DDB proves the pattern
- Removing `HeadlessCmsStorageOperations` interface from types.ts (needs all adapters migrated first)
- Removing `context.cms.storageOperations` from tests (separate cleanup — tests should resolve per-method abstractions from container)
