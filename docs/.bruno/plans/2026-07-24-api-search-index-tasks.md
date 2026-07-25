# api-search-index-tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reindex, createIndexes, and enableIndexing tasks from `@webiny/api-elasticsearch-tasks` into platform-agnostic `@webiny/api-search-index-tasks` with a DDB+OS bridge in `@webiny/api-search-index-tasks-ddb-os`.

**Architecture:** Core package holds task definitions, runners, and three abstractions (StorageScanner, IndexManager, StorageWriter). Bridge package provides DDB + OpenSearch implementations. Tasks declare only the abstractions they need. Opaque string cursor for scanner pagination. Task IDs preserved for backward compat.

**Tech Stack:** TypeScript, `@webiny/feature` DI (createAbstraction/createImplementation), `@webiny/api-core` TaskDefinition, vitest

## Global Constraints

- No standalone `types.ts` — interfaces declared before namespace, namespace re-exports only
- One abstraction/implementation/feature per file
- Task IDs must match existing: `elasticsearchReindexing`, `elasticsearchCreateIndexes`, `elasticsearchEnableIndexing`
- No inline object types — extract to named interfaces
- Before commit: `yarn`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn format > /dev/null 2>&1`, `yarn lint`, `yarn webiny sync-dependencies`

---

### Task 1: Scaffold `api-search-index-tasks` package

**Files:**
- Create: `packages/api-search-index-tasks/package.json`
- Create: `packages/api-search-index-tasks/tsconfig.json`
- Create: `packages/api-search-index-tasks/tsconfig.build.json`
- Create: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: empty package that builds, other tasks add to it

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/api-search-index-tasks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-search-index-tasks"
  },
  "description": "Platform-agnostic search index background tasks.",
  "license": "MIT",
  "author": "Webiny Ltd.",
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "typescript": "^7.0.2",
    "vitest": "^4.1.10"
  },
  "publishConfig": {
    "access": "public"
  },
  "adio": {
    "ignoreDirs": ["__tests__"]
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "__tests__"],
  "references": [
    { "path": "../api" },
    { "path": "../api-core" },
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../utils" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src", "./__tests__"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "~tests/*": ["./__tests__/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-core/*": ["../api-core/src/*"],
      "@webiny/api-core": ["../api-core/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.build.json**

```json
{
  "extends": "../../tsconfig.build.json",
  "include": ["src"],
  "references": [
    { "path": "../api/tsconfig.build.json" },
    { "path": "../api-core/tsconfig.build.json" },
    { "path": "../error/tsconfig.build.json" },
    { "path": "../feature/tsconfig.build.json" },
    { "path": "../utils/tsconfig.build.json" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-core/*": ["../api-core/src/*"],
      "@webiny/api-core": ["../api-core/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 4: Create empty src/index.ts**

```typescript
export {};
```

- [ ] **Step 5: Run scaffolding commands**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 6: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "chore: scaffold @webiny/api-search-index-tasks package"
```

---

### Task 2: StorageScanner abstraction

**Files:**
- Create: `packages/api-search-index-tasks/src/abstractions/StorageScanner.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/api`, `GenericRecord` from `@webiny/api/types`
- Produces: `StorageScanner` abstraction with `IStorageScanner`, `IStorageScannerRecord`, `IStorageScannerResult`

- [ ] **Step 1: Create StorageScanner.ts**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IStorageScannerRecord {
    index: string;
    entity: string;
    data: GenericRecord;
    modified: string;
}

export interface IStorageScannerResult {
    items: IStorageScannerRecord[];
    cursor?: string;
}

export interface IStorageScanner {
    scan(cursor: string | undefined, limit: number): Promise<IStorageScannerResult>;
}

export const StorageScanner = createAbstraction<IStorageScanner>(
    "SearchIndexTasks/StorageScanner"
);

export namespace StorageScanner {
    export type Interface = IStorageScanner;
    export type Record = IStorageScannerRecord;
    export type Result = IStorageScannerResult;
}
```

- [ ] **Step 2: Export from index.ts**

```typescript
export { StorageScanner } from "./abstractions/StorageScanner.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add StorageScanner abstraction"
```

---

### Task 3: IndexManager abstraction

**Files:**
- Create: `packages/api-search-index-tasks/src/abstractions/IndexManager.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/api`, `GenericRecord` from `@webiny/api/types`
- Produces: `IndexManager` abstraction with `IIndexManager`, `IIndexSettings`, `IIndexSettingsMap`

- [ ] **Step 1: Create IndexManager.ts**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IIndexSettings {
    numberOfReplicas: number;
    refreshInterval: string;
}

export interface IIndexSettingsMap {
    [index: string]: IIndexSettings;
}

export interface IIndexManager {
    list(): Promise<string[]>;
    indexExists(index: string): Promise<boolean>;
    createIndex(index: string, settings?: GenericRecord): Promise<void>;
    disableIndexing(index: string): Promise<IIndexSettings>;
    enableIndexing(index?: string): Promise<void>;
    settings: IIndexSettingsMap;
}

export const IndexManager = createAbstraction<IIndexManager>(
    "SearchIndexTasks/IndexManager"
);

export namespace IndexManager {
    export type Interface = IIndexManager;
    export type Settings = IIndexSettings;
    export type SettingsMap = IIndexSettingsMap;
}
```

- [ ] **Step 2: Add export to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { IndexManager } from "./abstractions/IndexManager.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add IndexManager abstraction"
```

---

### Task 4: StorageWriter abstraction

**Files:**
- Create: `packages/api-search-index-tasks/src/abstractions/StorageWriter.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/api`, `GenericRecord` from `@webiny/api/types`
- Produces: `StorageWriter` abstraction with `IStorageWriter`, `IStorageWriterRecord`

- [ ] **Step 1: Create StorageWriter.ts**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IStorageWriterRecord {
    entity: string;
    data: GenericRecord;
}

export interface IStorageWriter {
    put(record: IStorageWriterRecord): void;
    execute(): Promise<void>;
}

export const StorageWriter = createAbstraction<IStorageWriter>(
    "SearchIndexTasks/StorageWriter"
);

export namespace StorageWriter {
    export type Interface = IStorageWriter;
    export type Record = IStorageWriterRecord;
}
```

- [ ] **Step 2: Add export to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { StorageWriter } from "./abstractions/StorageWriter.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add StorageWriter abstraction"
```

---

### Task 5: IndexManagerFactory abstraction

**Files:**
- Create: `packages/api-search-index-tasks/src/abstractions/IndexManagerFactory.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `IndexManager` from Task 3 (`IIndexManager`, `IIndexSettings`, `IIndexSettingsMap`)
- Produces: `IndexManagerFactory` abstraction with `IIndexManagerFactory`, `IIndexManagerFactoryParams`

- [ ] **Step 1: Create IndexManagerFactory.ts**

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager, IIndexSettings, IIndexSettingsMap } from "./IndexManager.js";

export interface IIndexManagerFactoryParams {
    settings: IIndexSettingsMap;
    defaults?: Partial<IIndexSettings>;
}

export interface IIndexManagerFactory {
    createIndexManager(params: IIndexManagerFactoryParams): IIndexManager;
}

export const IndexManagerFactory = createAbstraction<IIndexManagerFactory>(
    "SearchIndexTasks/IndexManagerFactory"
);

export namespace IndexManagerFactory {
    export type Interface = IIndexManagerFactory;
    export type Params = IIndexManagerFactoryParams;
}
```

- [ ] **Step 2: Add export to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { IndexManagerFactory } from "./abstractions/IndexManagerFactory.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add IndexManagerFactory abstraction"
```

---

### Task 6: EnableIndexing task — runner abstraction, runner impl, task definition

**Files:**
- Create: `packages/api-search-index-tasks/src/tasks/enableIndexing/abstractions/EnableIndexingRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/enableIndexing/EnableIndexingRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/enableIndexing/EnableIndexingTask.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `IndexManager` (Task 3), `IndexManagerFactory` (Task 5), `TaskDefinition` from `@webiny/api-core`
- Produces: `EnableIndexingRunner` abstraction + impl, `EnableIndexingTask` task definition

- [ ] **Step 1: Create runner abstraction**

Create `packages/api-search-index-tasks/src/tasks/enableIndexing/abstractions/EnableIndexingRunner.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IEnableIndexingInput {
    matching?: string;
    numberOfReplicas?: number;
    refreshInterval?: string;
}

export interface IEnableIndexingRunner {
    exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IEnableIndexingInput>>;
}

export const EnableIndexingRunner = createAbstraction<IEnableIndexingRunner>(
    "SearchIndexTasks/EnableIndexingRunner"
);

export namespace EnableIndexingRunner {
    export type Interface = IEnableIndexingRunner;
    export type Input = IEnableIndexingInput;
}
```

- [ ] **Step 2: Create runner impl**

Create `packages/api-search-index-tasks/src/tasks/enableIndexing/EnableIndexingRunner.ts`:

```typescript
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { EnableIndexingRunner as Abstraction } from "./abstractions/EnableIndexingRunner.js";

class EnableIndexingRunnerImpl implements Abstraction.Interface {
    constructor(private readonly controller: TaskController.Interface) {}

    public async exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<Abstraction.Input>> {
        if (this.controller.runtime.isAborted()) {
            return this.controller.response.aborted();
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const indexes = await indexManager.list();
        const enabled: string[] = [];
        const failed: string[] = [];
        for (const index of indexes) {
            if (!isIndexAllowed(index)) {
                continue;
            }
            try {
                await indexManager.enableIndexing(index);
                enabled.push(index);
            } catch (ex) {
                failed.push(index);
                await this.controller.logger.error({
                    message: `Failed to enable indexing on index "${index}".`,
                    error: ex
                });
            }
        }
        return this.controller.response.done("Task done.", {
            enabled,
            failed
        });
    }
}

export const EnableIndexingRunner = Abstraction.createImplementation({
    implementation: EnableIndexingRunnerImpl,
    dependencies: [TaskController]
});
```

- [ ] **Step 3: Create task definition**

Create `packages/api-search-index-tasks/src/tasks/enableIndexing/EnableIndexingTask.ts`:

```typescript
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { EnableIndexingRunner } from "./abstractions/EnableIndexingRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class EnableIndexingTaskImpl
    implements TaskDefinition.Interface<EnableIndexingRunner.Input>
{
    public readonly id = "elasticsearchEnableIndexing";
    public readonly title = "Enable Search Indexing";
    public readonly maxIterations = 2;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: EnableIndexingRunner.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<EnableIndexingRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {},
            defaults: {
                refreshInterval: input.refreshInterval,
                numberOfReplicas: input.numberOfReplicas
            }
        });

        return this.runner.exec(input.matching, indexManager);
    }
}

export const EnableIndexingTask = TaskDefinition.createImplementation({
    implementation: EnableIndexingTaskImpl,
    dependencies: [IndexManagerFactory, EnableIndexingRunner]
});
```

- [ ] **Step 4: Add exports to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { EnableIndexingRunner } from "./tasks/enableIndexing/abstractions/EnableIndexingRunner.js";
export { EnableIndexingRunner as EnableIndexingRunnerImpl } from "./tasks/enableIndexing/EnableIndexingRunner.js";
export { EnableIndexingTask } from "./tasks/enableIndexing/EnableIndexingTask.js";
```

- [ ] **Step 5: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add enableIndexing task"
```

---

### Task 7: CreateIndexes task — runner abstraction, OnBeforeTrigger abstraction, helpers, runner impl, OnBeforeTrigger impl, task definition

This task is larger because CreateIndexes depends on `OpenSearchTenantIndexFactory` (multi-binding), `TenantContext`, `ListTenantsUseCase`, plus two helper functions (`listIndexes`, `createIndexFactory`).

**Files:**
- Create: `packages/api-search-index-tasks/src/abstractions/TenantIndexFactory.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/abstractions/CreateIndexesRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/abstractions/OnBeforeTrigger.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/listIndexes.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/createIndexFactory.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/CreateIndexesRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/OnBeforeTrigger.ts`
- Create: `packages/api-search-index-tasks/src/tasks/createIndexes/CreateIndexesTask.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `IndexManager` (Task 3), `IndexManagerFactory` (Task 5), `TenantContext` + `ListTenantsUseCase` from `@webiny/api-core`, `TaskDefinition` + `TaskController` from `@webiny/api-core`
- Produces: `TenantIndexFactory` abstraction (platform-agnostic replacement for `OpenSearchTenantIndexFactory`), `CreateIndexesRunner` + `OnBeforeTrigger` abstractions + impls, `CreateIndexesTask` definition

Note: `OpenSearchTenantIndexFactory` from old package references `OpenSearchIndexRequestBody` — a platform-specific type. New `TenantIndexFactory` uses `GenericRecord` for settings body instead. The abstraction key is `"OpenSearchTenantIndexFactory"` (same as old) so existing consumer registrations (e.g. `api-headless-cms-ddb-es`) resolve without changes. Consumers should migrate to importing `TenantIndexFactory` from new package over time.

- [ ] **Step 1: Create TenantIndexFactory abstraction**

Create `packages/api-search-index-tasks/src/abstractions/TenantIndexFactory.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface ITenantIndexConfig {
    index: string;
    settings?: GenericRecord;
}

export interface ITenantIndexFactory {
    getIndexList(tenant: Pick<Tenant, "id">): Promise<ITenantIndexConfig[]>;
}

export const TenantIndexFactory = createAbstraction<ITenantIndexFactory>(
    "OpenSearchTenantIndexFactory"
);

export namespace TenantIndexFactory {
    export type Interface = ITenantIndexFactory;
    export type IndexConfig = ITenantIndexConfig;
}
```

- [ ] **Step 2: Create CreateIndexesRunner abstraction**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/abstractions/CreateIndexesRunner.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ICreateIndexesInput {
    matching?: string;
    done?: string[];
}

export interface ICreateIndexesRunner {
    execute(
        matching: string | undefined,
        done: string[],
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result>;
}

export const CreateIndexesRunner = createAbstraction<ICreateIndexesRunner>(
    "SearchIndexTasks/CreateIndexesRunner"
);

export namespace CreateIndexesRunner {
    export type Interface = ICreateIndexesRunner;
    export type Input = ICreateIndexesInput;
}
```

- [ ] **Step 3: Create OnBeforeTrigger abstraction**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/abstractions/OnBeforeTrigger.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";

export interface IOnBeforeTrigger {
    run(targets: string[] | undefined, indexManager: IIndexManager): Promise<void>;
}

export const OnBeforeTrigger = createAbstraction<IOnBeforeTrigger>(
    "SearchIndexTasks/OnBeforeTrigger"
);

export namespace OnBeforeTrigger {
    export type Interface = IOnBeforeTrigger;
}
```

- [ ] **Step 4: Create listIndexes helper**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/listIndexes.ts`:

```typescript
import type { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export const listIndexes = async (
    tenantContext: TenantContext.Interface,
    tenants: Tenant[],
    indexFactories: TenantIndexFactory.Interface[]
): Promise<TenantIndexFactory.IndexConfig[]> => {
    if (indexFactories.length === 0) {
        return [];
    }

    const indexes: TenantIndexFactory.IndexConfig[] = [];
    await tenantContext.withEachTenant(tenants, async tenant => {
        for (const factory of indexFactories) {
            const results = await factory.getIndexList(tenant);
            for (const result of results) {
                if (indexes.some(i => i.index === result.index)) {
                    continue;
                }
                indexes.push(result);
            }
        }
    });

    return indexes;
};
```

- [ ] **Step 5: Create createIndexFactory helper**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/createIndexFactory.ts`:

```typescript
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { GenericRecord } from "@webiny/api/types.js";

export const createIndexFactory = (manager: IIndexManager) => {
    return {
        create: async (index: string, settings?: GenericRecord): Promise<void> => {
            return manager.createIndex(index, settings);
        },
        createIfNotExists: async (index: string, settings?: GenericRecord): Promise<void> => {
            try {
                const exists = await manager.indexExists(index);
                if (exists) {
                    return;
                }
            } catch {
                return;
            }

            return await manager.createIndex(index, settings);
        }
    };
};
```

- [ ] **Step 6: Create CreateIndexesRunner impl**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/CreateIndexesRunner.ts`:

```typescript
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "./createIndexFactory.js";
import { CreateIndexesRunner as Abstraction } from "./abstractions/CreateIndexesRunner.js";

class CreateIndexesRunnerImpl implements Abstraction.Interface {
    constructor(
        private readonly controller: TaskController.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantsUseCase: ListTenantsUseCase.Interface,
        private readonly indexFactories: TenantIndexFactory.Interface[]
    ) {}

    public async execute(
        matching: string | undefined,
        done: string[],
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result> {
        if (this.indexFactories.length === 0) {
            return this.controller.response.done("No index plugins found.");
        }

        const tenantsResult = await this.listTenantsUseCase.execute();
        const tenants = tenantsResult.value;

        const indexes = await listIndexes(this.tenantContext, tenants, this.indexFactories);

        if (indexes.length === 0) {
            return this.controller.response.done("No indexes found.");
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const factory = createIndexFactory(indexManager);

        for (const { index, settings } of indexes) {
            if (this.controller.runtime.isAborted()) {
                return this.controller.response.aborted();
            } else if (this.controller.runtime.isCloseToTimeout()) {
                return this.controller.response.continue({
                    done
                });
            }
            try {
                if (done.includes(index)) {
                    continue;
                } else if (isIndexAllowed(index) === false) {
                    continue;
                }
                const exists = await indexManager.indexExists(index);
                if (exists) {
                    continue;
                }
                done.push(index);
                await factory.create(index, settings);
                await this.controller.logger.info({
                    message: `Index "${index}" created.`,
                    data: { index }
                });
            } catch (ex) {
                await this.controller.logger.error({
                    message: `Failed to create index "${index}".`,
                    error: ex
                });
            }
        }

        return this.controller.response.done("Indexes created.", {
            done
        });
    }
}

export const CreateIndexesRunner = Abstraction.createImplementation({
    implementation: CreateIndexesRunnerImpl,
    dependencies: [
        TaskController,
        TenantContext,
        ListTenantsUseCase,
        [TenantIndexFactory, { multiple: true }]
    ]
});
```

- [ ] **Step 7: Create OnBeforeTrigger impl**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/OnBeforeTrigger.ts`:

```typescript
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "./createIndexFactory.js";
import { OnBeforeTrigger as Abstraction } from "./abstractions/OnBeforeTrigger.js";

class OnBeforeTriggerImpl implements Abstraction.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly indexFactories: TenantIndexFactory.Interface[]
    ) {}

    public async run(targets: string[] | undefined, indexManager: IIndexManager): Promise<void> {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            throw new Error("Something went wrong, tenant not found when triggering a task.");
        }

        try {
            const allIndexes = await listIndexes(this.tenantContext, [tenant], this.indexFactories);

            const indexes = allIndexes.filter(index => {
                if (!targets?.length) {
                    return true;
                }
                for (const t of targets) {
                    if (index.index.includes(t)) {
                        return true;
                    }
                }
                return false;
            });
            if (indexes.length === 0) {
                console.warn(
                    "There are no indexes to create before triggering the Create indexes task.",
                    {
                        targets
                    }
                );
                return;
            }

            const factory = createIndexFactory(indexManager);

            for (const { index, settings } of indexes) {
                try {
                    console.log("Creating index", index);
                    await factory.createIfNotExists(index, settings);
                } catch (ex) {
                    console.error(`Failed to create index "${index}".`, ex);
                }
            }
        } catch (ex) {
            console.error(ex);
        }
    }
}

export const OnBeforeTrigger = Abstraction.createImplementation({
    implementation: OnBeforeTriggerImpl,
    dependencies: [TenantContext, [TenantIndexFactory, { multiple: true }]]
});
```

- [ ] **Step 8: Create CreateIndexesTask definition**

Create `packages/api-search-index-tasks/src/tasks/createIndexes/CreateIndexesTask.ts`:

```typescript
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CreateIndexesRunner } from "./abstractions/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class CreateIndexesTaskImpl
    implements TaskDefinition.Interface<CreateIndexesRunner.Input>
{
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Search Indexes";
    public readonly maxIterations = 2;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: CreateIndexesRunner.Interface,
        private readonly onBeforeTriggerRunner: OnBeforeTrigger.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<CreateIndexesRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        return this.runner.execute(input.matching, Array.from(input.done || []), indexManager);
    }

    async onBeforeTrigger() {
        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        await this.onBeforeTriggerRunner.run(["wbytask"], indexManager);
    }
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: [IndexManagerFactory, CreateIndexesRunner, OnBeforeTrigger]
});
```

- [ ] **Step 9: Add exports to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { TenantIndexFactory } from "./abstractions/TenantIndexFactory.js";
export { CreateIndexesRunner } from "./tasks/createIndexes/abstractions/CreateIndexesRunner.js";
export { OnBeforeTrigger } from "./tasks/createIndexes/abstractions/OnBeforeTrigger.js";
export { CreateIndexesRunner as CreateIndexesRunnerImpl } from "./tasks/createIndexes/CreateIndexesRunner.js";
export { OnBeforeTrigger as OnBeforeTriggerImpl } from "./tasks/createIndexes/OnBeforeTrigger.js";
export { CreateIndexesTask } from "./tasks/createIndexes/CreateIndexesTask.js";
```

- [ ] **Step 10: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 11: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add createIndexes task"
```

---

### Task 8: Reindex task — runner abstraction, runner impl, task definition

**Files:**
- Create: `packages/api-search-index-tasks/src/tasks/reindex/abstractions/ReindexRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/reindex/ReindexRunner.ts`
- Create: `packages/api-search-index-tasks/src/tasks/reindex/ReindexTask.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: `StorageScanner` (Task 2), `StorageWriter` (Task 4), `IndexManager` (Task 3), `IndexManagerFactory` (Task 5), `TaskController` + `TaskDefinition` from `@webiny/api-core`
- Produces: `ReindexRunner` abstraction + impl, `ReindexTask` definition

- [ ] **Step 1: Create runner abstraction**

Create `packages/api-search-index-tasks/src/tasks/reindex/abstractions/ReindexRunner.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager, IIndexSettingsMap } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IReindexInput {
    matching?: string;
    limit?: number;
    cursor?: string;
    settings?: IIndexSettingsMap;
}

export interface IReindexRunner {
    exec(
        cursor: string | undefined,
        limit: number,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IReindexInput>>;
}

export const ReindexRunner = createAbstraction<IReindexRunner>(
    "SearchIndexTasks/ReindexRunner"
);

export namespace ReindexRunner {
    export type Interface = IReindexRunner;
    export type Input = IReindexInput;
}
```

- [ ] **Step 2: Create runner impl**

Create `packages/api-search-index-tasks/src/tasks/reindex/ReindexRunner.ts`:

```typescript
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { StorageScanner } from "~/abstractions/StorageScanner.js";
import { StorageWriter } from "~/abstractions/StorageWriter.js";
import { ReindexRunner as Abstraction } from "./abstractions/ReindexRunner.js";

class ReindexRunnerImpl implements Abstraction.Interface {
    constructor(
        private readonly controller: TaskController.Interface,
        private readonly scanner: StorageScanner.Interface,
        private readonly writer: StorageWriter.Interface
    ) {}

    public async exec(
        cursor: string | undefined,
        limit: number,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<Abstraction.Input>> {
        const isIndexAllowed = (index: string): boolean => {
            const input = this.controller.state.getInput();
            if (typeof input.matching !== "string" || !input.matching) {
                return true;
            }
            return index.includes(input.matching);
        };

        try {
            while (this.controller.runtime.isCloseToTimeout() === false) {
                if (this.controller.runtime.isAborted()) {
                    return this.controller.response.aborted();
                }

                const results = await this.scanner.scan(cursor, limit);
                if (results.items.length === 0) {
                    await indexManager.enableIndexing();
                    return this.controller.response.done("No more items to process.");
                }

                for (const item of results.items) {
                    if (!item.index) {
                        continue;
                    }
                    if (isIndexAllowed(item.index) === false) {
                        continue;
                    }
                    const exists = await indexManager.indexExists(item.index);
                    if (!exists) {
                        await this.controller.logger.info({
                            message: `Index "${item.index}" does not exist. Skipping the item.`
                        });
                        continue;
                    }
                    if (!item.entity) {
                        continue;
                    }
                    await indexManager.disableIndexing(item.index);
                    this.writer.put({
                        entity: item.entity,
                        data: {
                            ...item.data,
                            modified: new Date().toISOString()
                        }
                    });
                }
                await this.writer.execute();
                cursor = results.cursor;
                await this.controller.state.updateInput({
                    settings: indexManager.settings,
                    cursor
                });
                if (!cursor) {
                    await indexManager.enableIndexing();
                    return this.controller.response.done(
                        "No more items to process - no last evaluated keys."
                    );
                }
            }
            return this.controller.response.continue({
                cursor
            });
        } catch (ex) {
            try {
                await indexManager.enableIndexing();
            } catch (er) {
                er.data = ex;
                return this.controller.response.error(er);
            }
            return this.controller.response.error(ex);
        }
    }
}

export const ReindexRunner = Abstraction.createImplementation({
    implementation: ReindexRunnerImpl,
    dependencies: [TaskController, StorageScanner, StorageWriter]
});
```

- [ ] **Step 3: Create task definition**

Create `packages/api-search-index-tasks/src/tasks/reindex/ReindexTask.ts`:

```typescript
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ReindexRunner } from "./abstractions/ReindexRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class ReindexTaskImpl implements TaskDefinition.Interface<ReindexRunner.Input> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Reindex Search Index";
    public readonly maxIterations = 500;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexRunner.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<ReindexRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: input.settings || {}
        });

        const cursor = input.cursor || undefined;
        return await this.runner.exec(cursor, input.limit || 100, indexManager);
    }
}

export const ReindexTask = TaskDefinition.createImplementation({
    implementation: ReindexTaskImpl,
    dependencies: [IndexManagerFactory, ReindexRunner]
});
```

- [ ] **Step 4: Add exports to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { ReindexRunner } from "./tasks/reindex/abstractions/ReindexRunner.js";
export { ReindexRunner as ReindexRunnerImpl } from "./tasks/reindex/ReindexRunner.js";
export { ReindexTask } from "./tasks/reindex/ReindexTask.js";
```

- [ ] **Step 5: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add reindex task"
```

---

### Task 9: SearchIndexTasksFeature — feature registration

**Files:**
- Create: `packages/api-search-index-tasks/src/feature.ts`
- Modify: `packages/api-search-index-tasks/src/index.ts`

**Interfaces:**
- Consumes: all task + runner registrations from Tasks 6-8
- Produces: `SearchIndexTasksFeature` — single feature that registers all tasks and runners

- [ ] **Step 1: Create feature.ts**

```typescript
import { type Container, createFeature } from "@webiny/feature/api";
import { ReindexRunner } from "~/tasks/reindex/ReindexRunner.js";
import { ReindexTask } from "~/tasks/reindex/ReindexTask.js";
import { EnableIndexingRunner } from "~/tasks/enableIndexing/EnableIndexingRunner.js";
import { EnableIndexingTask } from "~/tasks/enableIndexing/EnableIndexingTask.js";
import { CreateIndexesRunner } from "~/tasks/createIndexes/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "~/tasks/createIndexes/OnBeforeTrigger.js";
import { CreateIndexesTask } from "~/tasks/createIndexes/CreateIndexesTask.js";

export const SearchIndexTasksFeature = createFeature({
    name: "SearchIndexTasks",
    register(container: Container) {
        container.register(ReindexRunner);
        container.register(ReindexTask);
        container.register(EnableIndexingRunner);
        container.register(EnableIndexingTask);
        container.register(CreateIndexesRunner);
        container.register(OnBeforeTrigger);
        container.register(CreateIndexesTask);
    }
});
```

- [ ] **Step 2: Add export to index.ts**

Add to `packages/api-search-index-tasks/src/index.ts`:

```typescript
export { SearchIndexTasksFeature } from "./feature.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks/
git commit -m "feat(api-search-index-tasks): add SearchIndexTasksFeature"
```

---

### Task 10: Scaffold `api-search-index-tasks-ddb-os` package

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/package.json`
- Create: `packages/api-search-index-tasks-ddb-os/tsconfig.json`
- Create: `packages/api-search-index-tasks-ddb-os/tsconfig.build.json`
- Create: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: empty bridge package that builds

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/api-search-index-tasks-ddb-os",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-search-index-tasks-ddb-os"
  },
  "description": "DynamoDB + OpenSearch bridge for @webiny/api-search-index-tasks.",
  "license": "MIT",
  "author": "Webiny Ltd.",
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/api-search-index-tasks": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/db-dynamodb": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "typescript": "^7.0.2",
    "vitest": "^4.1.10"
  },
  "publishConfig": {
    "access": "public"
  },
  "adio": {
    "ignoreDirs": ["__tests__"]
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "__tests__"],
  "references": [
    { "path": "../api" },
    { "path": "../api-opensearch" },
    { "path": "../api-search-index-tasks" },
    { "path": "../aws-sdk" },
    { "path": "../db-dynamodb" },
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../utils" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src", "./__tests__"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "~tests/*": ["./__tests__/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-opensearch/*": ["../api-opensearch/src/*"],
      "@webiny/api-opensearch": ["../api-opensearch/src"],
      "@webiny/api-search-index-tasks/*": ["../api-search-index-tasks/src/*"],
      "@webiny/api-search-index-tasks": ["../api-search-index-tasks/src"],
      "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
      "@webiny/aws-sdk": ["../aws-sdk/src"],
      "@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
      "@webiny/db-dynamodb": ["../db-dynamodb/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.build.json**

```json
{
  "extends": "../../tsconfig.build.json",
  "include": ["src"],
  "references": [
    { "path": "../api/tsconfig.build.json" },
    { "path": "../api-opensearch/tsconfig.build.json" },
    { "path": "../api-search-index-tasks/tsconfig.build.json" },
    { "path": "../aws-sdk/tsconfig.build.json" },
    { "path": "../db-dynamodb/tsconfig.build.json" },
    { "path": "../error/tsconfig.build.json" },
    { "path": "../feature/tsconfig.build.json" },
    { "path": "../utils/tsconfig.build.json" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/api-opensearch/*": ["../api-opensearch/src/*"],
      "@webiny/api-opensearch": ["../api-opensearch/src"],
      "@webiny/api-search-index-tasks/*": ["../api-search-index-tasks/src/*"],
      "@webiny/api-search-index-tasks": ["../api-search-index-tasks/src"],
      "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
      "@webiny/aws-sdk": ["../aws-sdk/src"],
      "@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
      "@webiny/db-dynamodb": ["../db-dynamodb/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 4: Create empty src/index.ts**

```typescript
export {};
```

- [ ] **Step 5: Run scaffolding commands**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 6: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "chore: scaffold @webiny/api-search-index-tasks-ddb-os package"
```

---

### Task 11: Bridge — error classes + IndexSettingsManager

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/src/errors/IndexSettingsGetError.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/errors/IndexSettingsSetError.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/errors/IndexingDisableError.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/errors/IndexingEnableError.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/IndexSettingsManager.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/IndexSettingsManager.ts`
- Modify: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: `IIndexSettings` from `@webiny/api-search-index-tasks`, `OpenSearchClient` from `@webiny/api-opensearch`
- Produces: `IndexSettingsManager` abstraction + impl, error classes

- [ ] **Step 1: Create error classes**

Create `packages/api-search-index-tasks-ddb-os/src/errors/IndexSettingsGetError.ts`:

```typescript
export class IndexSettingsGetError extends Error {
    public readonly index: string;
    constructor(cause: unknown, index: string) {
        super(`Failed to get settings for index "${index}".`);
        this.index = index;
        this.cause = cause;
    }
}
```

Create `packages/api-search-index-tasks-ddb-os/src/errors/IndexSettingsSetError.ts`:

```typescript
export class IndexSettingsSetError extends Error {
    public readonly index: string;
    constructor(cause: unknown, index: string) {
        super(`Failed to set settings for index "${index}".`);
        this.index = index;
        this.cause = cause;
    }
}
```

Create `packages/api-search-index-tasks-ddb-os/src/errors/IndexingDisableError.ts`:

```typescript
export class IndexingDisableError extends Error {}
```

Create `packages/api-search-index-tasks-ddb-os/src/errors/IndexingEnableError.ts`:

```typescript
export class IndexingEnableError extends Error {}
```

- [ ] **Step 2: Create IndexSettingsManager abstraction**

Create `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/IndexSettingsManager.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IIndexSettingsManager {
    getSettings(index: string): Promise<IIndexSettings>;
    setSettings(index: string, settings: IIndexSettings): Promise<void>;
}

export const IndexSettingsManager = createAbstraction<IIndexSettingsManager>(
    "SearchIndexTasksDdbOs/IndexSettingsManager"
);

export namespace IndexSettingsManager {
    export type Interface = IIndexSettingsManager;
    export type Settings = IIndexSettings;
}
```

- [ ] **Step 3: Create IndexSettingsManager impl**

Create `packages/api-search-index-tasks-ddb-os/src/settings/IndexSettingsManager.ts`:

```typescript
import { IndexSettingsGetError } from "~/errors/IndexSettingsGetError.js";
import { IndexSettingsSetError } from "~/errors/IndexSettingsSetError.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { IndexSettingsManager as Abstraction } from "./abstractions/IndexSettingsManager.js";

class IndexSettingsManagerImpl implements Abstraction.Interface {
    constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public async getSettings(index: string): Promise<Abstraction.Settings> {
        try {
            const response = await this.openSearchClient.use().indices.getSettings({
                index
            });

            const setting = response.body[index]?.settings?.index;

            return {
                numberOfReplicas: parseInt(String(setting?.number_of_replicas ?? "0"), 10),
                refreshInterval: setting?.refresh_interval ?? "1s"
            };
        } catch (ex) {
            throw new IndexSettingsGetError(ex, index);
        }
    }

    public async setSettings(index: string, settings: Abstraction.Settings): Promise<void> {
        try {
            await this.openSearchClient.use().indices.putSettings({
                index,
                body: {
                    index: {
                        number_of_replicas: settings.numberOfReplicas,
                        refresh_interval: settings.refreshInterval
                    }
                }
            });
        } catch (ex) {
            throw new IndexSettingsSetError(ex, index);
        }
    }
}

export const IndexSettingsManager = Abstraction.createImplementation({
    implementation: IndexSettingsManagerImpl,
    dependencies: [OpenSearchClient]
});
```

- [ ] **Step 4: Add exports to index.ts**

```typescript
export { IndexSettingsManager } from "./settings/abstractions/IndexSettingsManager.js";
export { IndexSettingsManager as IndexSettingsManagerImpl } from "./settings/IndexSettingsManager.js";
```

- [ ] **Step 5: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "feat(api-search-index-tasks-ddb-os): add error classes and IndexSettingsManager"
```

---

### Task 12: Bridge — DisableIndexing + EnableIndexing helpers

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/DisableIndexing.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/EnableIndexing.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/DisableIndexing.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/settings/EnableIndexing.ts`
- Modify: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: `IndexSettingsManager` from Task 11, `IIndexSettings` from core package
- Produces: `DisableIndexing` + `EnableIndexing` abstractions + impls

- [ ] **Step 1: Create DisableIndexing abstraction**

Create `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/DisableIndexing.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IDisableIndexing {
    exec(index: string): Promise<IIndexSettings>;
}

export const DisableIndexing = createAbstraction<IDisableIndexing>(
    "SearchIndexTasksDdbOs/DisableIndexing"
);

export namespace DisableIndexing {
    export type Interface = IDisableIndexing;
    export type Settings = IIndexSettings;
}
```

- [ ] **Step 2: Create EnableIndexing abstraction**

Create `packages/api-search-index-tasks-ddb-os/src/settings/abstractions/EnableIndexing.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IEnableIndexing {
    exec(index: string, settings: IIndexSettings): Promise<void>;
}

export const EnableIndexing = createAbstraction<IEnableIndexing>(
    "SearchIndexTasksDdbOs/EnableIndexing"
);

export namespace EnableIndexing {
    export type Interface = IEnableIndexing;
    export type Settings = IIndexSettings;
}
```

- [ ] **Step 3: Create DisableIndexing impl**

Create `packages/api-search-index-tasks-ddb-os/src/settings/DisableIndexing.ts`:

```typescript
import { IndexingDisableError } from "~/errors/IndexingDisableError.js";
import { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";
import { DisableIndexing as Abstraction } from "./abstractions/DisableIndexing.js";

class DisableIndexingImpl implements Abstraction.Interface {
    constructor(private readonly settings: IndexSettingsManager.Interface) {}

    public async exec(index: string): Promise<Abstraction.Settings> {
        const settings = await this.settings.getSettings(index);

        try {
            await this.settings.setSettings(index, {
                numberOfReplicas: 0,
                refreshInterval: "-1"
            });
        } catch (ex) {
            throw new IndexingDisableError(ex instanceof Error ? ex.message : String(ex));
        }

        return settings;
    }
}

export const DisableIndexing = Abstraction.createImplementation({
    implementation: DisableIndexingImpl,
    dependencies: [IndexSettingsManager]
});
```

- [ ] **Step 4: Create EnableIndexing impl**

Create `packages/api-search-index-tasks-ddb-os/src/settings/EnableIndexing.ts`:

```typescript
import { IndexingEnableError } from "~/errors/IndexingEnableError.js";
import { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";
import { EnableIndexing as Abstraction } from "./abstractions/EnableIndexing.js";

class EnableIndexingImpl implements Abstraction.Interface {
    constructor(private readonly settings: IndexSettingsManager.Interface) {}

    public async exec(index: string, settings: Abstraction.Settings): Promise<void> {
        try {
            const refreshInterval = parseInt(settings.refreshInterval || "", 10) || 0;
            await this.settings.setSettings(index, {
                ...settings,
                numberOfReplicas: settings.numberOfReplicas < 1 ? 1 : settings.numberOfReplicas,
                refreshInterval: refreshInterval <= 0 ? "1s" : settings.refreshInterval
            });
        } catch (ex) {
            throw new IndexingEnableError(ex instanceof Error ? ex.message : String(ex));
        }
    }
}

export const EnableIndexing = Abstraction.createImplementation({
    implementation: EnableIndexingImpl,
    dependencies: [IndexSettingsManager]
});
```

- [ ] **Step 5: Add exports to index.ts**

Add to `packages/api-search-index-tasks-ddb-os/src/index.ts`:

```typescript
export { DisableIndexing } from "./settings/abstractions/DisableIndexing.js";
export { EnableIndexing } from "./settings/abstractions/EnableIndexing.js";
export { DisableIndexing as DisableIndexingImpl } from "./settings/DisableIndexing.js";
export { EnableIndexing as EnableIndexingImpl } from "./settings/EnableIndexing.js";
```

- [ ] **Step 6: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "feat(api-search-index-tasks-ddb-os): add DisableIndexing and EnableIndexing"
```

---

### Task 13: Bridge — IndexManager impl + IndexManagerFactory impl

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/src/IndexManager.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/IndexManagerFactory.ts`
- Modify: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: `IIndexManager`, `IIndexManagerFactory`, `IIndexSettingsMap`, `IIndexSettings` from core package; `DisableIndexing`, `EnableIndexing` from Task 12; `OpenSearchClient` from `@webiny/api-opensearch`
- Produces: `OsIndexManager` class, `IndexManagerFactory` impl

- [ ] **Step 1: Create IndexManager impl**

Create `packages/api-search-index-tasks-ddb-os/src/IndexManager.ts`:

```typescript
import type { IIndexSettings, IIndexSettingsMap, IIndexManager } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";
import type { DisableIndexing } from "~/settings/abstractions/DisableIndexing.js";
import type { EnableIndexing } from "~/settings/abstractions/EnableIndexing.js";
import type { Client } from "@webiny/api-opensearch";
import type { GenericRecord } from "@webiny/api/types.js";
import { getObjectProperties } from "@webiny/utils";

export interface IListIndicesResponse {
    index: string;
}

const defaultIndexSettings: IIndexSettings = {
    numberOfReplicas: 1,
    refreshInterval: "1s"
};

const indexPrefix = process.env.OPENSEARCH_INDEX_PREFIX || "";
const filterIndex = (item?: string) => {
    if (!item) {
        return false;
    } else if (item.startsWith(".")) {
        return false;
    } else if (indexPrefix) {
        return item.startsWith(indexPrefix);
    }
    return true;
};

export class OsIndexManager implements IIndexManager {
    private readonly client: Client;
    private readonly disable: DisableIndexing.Interface;
    private readonly enable: EnableIndexing.Interface;
    private readonly _settings: IIndexSettingsMap;
    private readonly defaults: IIndexSettings;

    public get settings(): IIndexSettingsMap {
        return this._settings;
    }

    public constructor(
        client: Client,
        disableIndexing: DisableIndexing.Interface,
        enableIndexing: EnableIndexing.Interface,
        settings: IIndexSettingsMap,
        defaults?: Partial<IIndexSettings>
    ) {
        this.client = client;
        this.disable = disableIndexing;
        this.enable = enableIndexing;
        this._settings = settings;
        this.defaults = {
            refreshInterval: defaults?.refreshInterval || defaultIndexSettings.refreshInterval,
            numberOfReplicas: defaults?.numberOfReplicas || defaultIndexSettings.numberOfReplicas
        };
    }

    public async list(): Promise<string[]> {
        try {
            const response = await this.client.cat.indices({
                format: "json"
            });
            if (!Array.isArray(response.body)) {
                return [];
            }
            return response.body
                .map(item => item.index)
                .filter((index): index is string => filterIndex(index));
        } catch (ex) {
            console.error(
                JSON.stringify({
                    message: "Failed to list indices.",
                    error: getObjectProperties(ex)
                })
            );
            return [];
        }
    }

    public async disableIndexing(index: string): Promise<IIndexSettings> {
        if (this._settings[index]) {
            return this._settings[index];
        }
        const settings = await this.disable.exec(index);
        this._settings[index] = settings;
        return settings;
    }

    public async enableIndexing(index?: string): Promise<void> {
        if (!index) {
            const indexes = Object.keys(this._settings);
            for (const index of indexes) {
                await this.enableIndexing(index);
            }
            return;
        }
        const settings = this._settings[index] || this.defaults;
        await this.enable.exec(index, settings);
    }

    public async createIndex(index: string, settings?: GenericRecord): Promise<void> {
        await this.client.indices.create({
            index,
            body: settings
        });
    }

    public async indexExists(index: string): Promise<boolean> {
        const response = await this.client.indices.exists({
            index,
            ignore_unavailable: false,
            allow_no_indices: true,
            include_defaults: true,
            flat_settings: false,
            local: false
        });
        return !!response.body;
    }
}
```

- [ ] **Step 2: Create IndexManagerFactory impl**

Create `packages/api-search-index-tasks-ddb-os/src/IndexManagerFactory.ts`:

```typescript
import { OsIndexManager } from "~/IndexManager.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DisableIndexing } from "~/settings/abstractions/DisableIndexing.js";
import { EnableIndexing } from "~/settings/abstractions/EnableIndexing.js";
import { IndexManagerFactory as Abstraction } from "@webiny/api-search-index-tasks/abstractions/IndexManagerFactory.js";

class IndexManagerFactoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly disableIndexing: DisableIndexing.Interface,
        private readonly enableIndexing: EnableIndexing.Interface
    ) {}

    public createIndexManager(params: Abstraction.Params) {
        return new OsIndexManager(
            this.openSearchClient.use(),
            this.disableIndexing,
            this.enableIndexing,
            params.settings,
            params.defaults
        );
    }
}

export const IndexManagerFactory = Abstraction.createImplementation({
    implementation: IndexManagerFactoryImpl,
    dependencies: [OpenSearchClient, DisableIndexing, EnableIndexing]
});
```

- [ ] **Step 3: Add exports to index.ts**

Add to `packages/api-search-index-tasks-ddb-os/src/index.ts`:

```typescript
export { OsIndexManager } from "./IndexManager.js";
export { IndexManagerFactory } from "./IndexManagerFactory.js";
```

- [ ] **Step 4: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "feat(api-search-index-tasks-ddb-os): add IndexManager and IndexManagerFactory"
```

---

### Task 14: Bridge — StorageScanner + StorageWriter impls

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/src/StorageScanner.ts`
- Create: `packages/api-search-index-tasks-ddb-os/src/StorageWriter.ts`
- Modify: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: `IStorageScanner`, `IStorageScannerResult`, `IStorageWriter`, `IStorageWriterRecord` from core package; DDB scan/batch from `@webiny/db-dynamodb`; `createOpenSearchTable`, `createOpenSearchEntity` from `@webiny/api-opensearch`; `DynamoDBClient` from `@webiny/db-dynamodb`
- Produces: `DdbStorageScanner`, `DdbStorageWriter` impls

- [ ] **Step 1: Create StorageScanner impl**

Create `packages/api-search-index-tasks-ddb-os/src/StorageScanner.ts`:

```typescript
import type { IStorageScanner, IStorageScannerResult } from "@webiny/api-search-index-tasks/abstractions/StorageScanner.js";
import { StorageScanner as Abstraction } from "@webiny/api-search-index-tasks/abstractions/StorageScanner.js";
import { scan } from "@webiny/db-dynamodb";
import { createOpenSearchTable } from "@webiny/api-opensearch";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

interface IDynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    index: string;
    _et?: string;
    entity: string;
    data: Record<string, any>;
    modified: string;
    [key: string]: any;
}

interface IDdbCursor {
    PK: string;
    SK: string;
}

class DdbStorageScannerImpl implements IStorageScanner {
    private readonly table;

    constructor(dynamoDBClient: DynamoDBClient.Interface) {
        this.table = createOpenSearchTable({
            documentClient: dynamoDBClient.client
        });
    }

    async scan(cursor: string | undefined, limit: number): Promise<IStorageScannerResult> {
        const startKey = cursor ? (JSON.parse(cursor) as IDdbCursor) : undefined;

        const results = await scan<IDynamoDbElasticsearchRecord>({
            table: this.table.table,
            options: {
                startKey,
                limit
            }
        });

        const items = results.items.map(item => ({
            index: item.index,
            entity: item._et || item.entity,
            data: item,
            modified: item.modified
        }));

        let nextCursor: string | undefined;
        if (results.lastEvaluatedKey?.PK && results.lastEvaluatedKey?.SK) {
            nextCursor = JSON.stringify({
                PK: results.lastEvaluatedKey.PK,
                SK: results.lastEvaluatedKey.SK
            });
        }

        return {
            items,
            cursor: nextCursor
        };
    }
}

export const DdbStorageScanner = Abstraction.createImplementation({
    implementation: DdbStorageScannerImpl,
    dependencies: [DynamoDBClient]
});
```

- [ ] **Step 2: Create StorageWriter impl**

Create `packages/api-search-index-tasks-ddb-os/src/StorageWriter.ts`:

```typescript
import type { IStorageWriter, IStorageWriterRecord } from "@webiny/api-search-index-tasks/abstractions/StorageWriter.js";
import { StorageWriter as Abstraction } from "@webiny/api-search-index-tasks/abstractions/StorageWriter.js";
import { createTableWriteBatch, type IEntity } from "@webiny/db-dynamodb";
import { createOpenSearchTable, createOpenSearchEntity } from "@webiny/api-opensearch";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

interface IBufferedRecord {
    entity: IEntity;
    data: Record<string, any>;
}

class DdbStorageWriterImpl implements IStorageWriter {
    private readonly table;
    private readonly entities: Record<string, IEntity> = {};
    private buffer: IBufferedRecord[] = [];

    constructor(dynamoDBClient: DynamoDBClient.Interface) {
        this.table = createOpenSearchTable({
            documentClient: dynamoDBClient.client
        });
    }

    put(record: IStorageWriterRecord): void {
        const entity = this.getEntity(record.entity);
        this.buffer.push({
            entity,
            data: record.data
        });
    }

    async execute(): Promise<void> {
        if (this.buffer.length === 0) {
            return;
        }

        const batch = createTableWriteBatch({
            table: this.table.table
        });

        for (const { entity, data } of this.buffer) {
            batch.put(entity.entity, data);
        }

        await batch.execute();
        this.buffer = [];
    }

    private getEntity(name: string): IEntity {
        if (this.entities[name]) {
            return this.entities[name];
        }

        return (this.entities[name] = createOpenSearchEntity({
            table: this.table,
            entityName: name
        }));
    }
}

export const DdbStorageWriter = Abstraction.createImplementation({
    implementation: DdbStorageWriterImpl,
    dependencies: [DynamoDBClient]
});
```

- [ ] **Step 3: Add exports to index.ts**

Add to `packages/api-search-index-tasks-ddb-os/src/index.ts`:

```typescript
export { DdbStorageScanner } from "./StorageScanner.js";
export { DdbStorageWriter } from "./StorageWriter.js";
```

- [ ] **Step 4: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "feat(api-search-index-tasks-ddb-os): add StorageScanner and StorageWriter"
```

---

### Task 15: Bridge — SearchIndexTasksDdbOsFeature

**Files:**
- Create: `packages/api-search-index-tasks-ddb-os/src/feature.ts`
- Modify: `packages/api-search-index-tasks-ddb-os/src/index.ts`

**Interfaces:**
- Consumes: all bridge impls from Tasks 11-14
- Produces: `SearchIndexTasksDdbOsFeature`

- [ ] **Step 1: Create feature.ts**

```typescript
import { type Container, createFeature } from "@webiny/feature/api";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "~/settings/DisableIndexing.js";
import { EnableIndexing } from "~/settings/EnableIndexing.js";
import { IndexManagerFactory } from "~/IndexManagerFactory.js";
import { DdbStorageScanner } from "~/StorageScanner.js";
import { DdbStorageWriter } from "~/StorageWriter.js";

export const SearchIndexTasksDdbOsFeature = createFeature({
    name: "SearchIndexTasksDdbOs",
    register(container: Container) {
        container.register(DdbStorageScanner);
        container.register(DdbStorageWriter);
        container.register(IndexSettingsManager);
        container.register(DisableIndexing);
        container.register(EnableIndexing);
        container.register(IndexManagerFactory);
    }
});
```

- [ ] **Step 2: Add export to index.ts**

Add to `packages/api-search-index-tasks-ddb-os/src/index.ts`:

```typescript
export { SearchIndexTasksDdbOsFeature } from "./feature.js";
```

- [ ] **Step 3: Verify build**

```bash
yarn build -p @webiny/api-search-index-tasks-ddb-os 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-search-index-tasks-ddb-os/
git commit -m "feat(api-search-index-tasks-ddb-os): add SearchIndexTasksDdbOsFeature"
```

---

### Task 16: Rewire `api-elasticsearch-tasks` as thin wrapper

**Files:**
- Modify: `packages/api-elasticsearch-tasks/src/ElasticsearchTasksFeature.ts`
- Modify: `packages/api-elasticsearch-tasks/package.json` (add dependency on new packages)

**Interfaces:**
- Consumes: `SearchIndexTasksFeature` from core package, `SearchIndexTasksDdbOsFeature` from bridge
- Produces: `ElasticsearchTasksFeature` that composes both + dataSynchronization registrations

- [ ] **Step 1: Add dependencies to package.json**

Add to `dependencies` in `packages/api-elasticsearch-tasks/package.json`:

```json
"@webiny/api-search-index-tasks": "0.0.0",
"@webiny/api-search-index-tasks-ddb-os": "0.0.0"
```

- [ ] **Step 2: Verify tasks/index.ts and src/index.ts stay unchanged**

`packages/api-elasticsearch-tasks/src/tasks/index.ts` must NOT be modified — it still exports old task registrations (`ElasticsearchReindexingTask`, `ElasticsearchEnableIndexingTask`, `CreateIndexesTask`, `Manager`, etc.) for backward compatibility. Other packages may import these directly.

`packages/api-elasticsearch-tasks/src/index.ts` must keep exporting `OpenSearchTenantIndexFactory` — `api-headless-cms-ddb-es` imports it from there. The old `OpenSearchTenantIndexFactory` and new `TenantIndexFactory` share the same DI key, so registrations work with either import.

- [ ] **Step 3: Rewrite ElasticsearchTasksFeature.ts**

Replace `packages/api-elasticsearch-tasks/src/ElasticsearchTasksFeature.ts` with:

```typescript
import { type Container, createFeature } from "@webiny/feature/api";
import { SearchIndexTasksFeature } from "@webiny/api-search-index-tasks";
import { SearchIndexTasksDdbOsFeature } from "@webiny/api-search-index-tasks-ddb-os";
import {
    DataSynchronizationTask,
    ElasticsearchSynchronize,
    ElasticsearchFetcher,
    ElasticsearchToDynamoDbSynchronization,
    Manager
} from "~/tasks/index.js";

export const ElasticsearchTasksFeature = createFeature({
    name: "ElasticsearchTasks",
    register(container: Container) {
        SearchIndexTasksFeature.register(container);
        SearchIndexTasksDdbOsFeature.register(container);

        container.register(Manager);
        container.register(ElasticsearchSynchronize);
        container.register(ElasticsearchFetcher);
        container.register(ElasticsearchToDynamoDbSynchronization);
        container.register(DataSynchronizationTask);
    }
});
```

- [ ] **Step 4: Run scaffolding**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 5: Verify build of all three packages**

```bash
yarn build -p @webiny/api-search-index-tasks -p @webiny/api-search-index-tasks-ddb-os -p @webiny/api-elasticsearch-tasks 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-elasticsearch-tasks/
git commit -m "refactor(api-elasticsearch-tasks): rewire as thin wrapper over api-search-index-tasks"
```

---

### Task 17: Run full pre-commit checks

**Files:** all changed packages

- [ ] **Step 1: Run format**

```bash
yarn format > /dev/null 2>&1
```

- [ ] **Step 2: Run lint**

```bash
yarn lint 2>&1 | tail -20
```

- [ ] **Step 3: Run sync-dependencies**

```bash
yarn webiny sync-dependencies 2>&1 | tail -10
```

- [ ] **Step 4: Run adio**

```bash
yarn adio 2>&1 | tail -10
```

- [ ] **Step 5: Run existing tests**

```bash
yarn test packages/api-elasticsearch-tasks 2>&1 | tail -50
```

Expected: existing tests still pass — `ElasticsearchTasksFeature` composes same registrations.

- [ ] **Step 6: Fix any issues and recommit if needed**

- [ ] **Step 7: Final commit if any formatting/lint changes**

```bash
git add .
git commit -m "chore: format and lint fixes"
```
