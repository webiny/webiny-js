# api-aco / api-aco-ddb Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all DynamoDB storage code from `@webiny/api-aco` into a new `@webiny/api-aco-ddb` package so the base package has zero storage-backend knowledge.

**Architecture:** The base package defines a `FlpStorageOperations` DI abstraction. The new DDB package registers an implementation against it via `createRegisterExtensionPlugin`. At runtime, `setupAcoContext` resolves FLP storage operations from the container instead of creating them internally.

**Tech Stack:** TypeScript, DI (`@webiny/feature`, `@webiny/di`), DynamoDB (`@webiny/db-dynamodb`)

**Spec:** `docs/superpowers/specs/2026-06-10-api-aco-ddb-split-design.md`

---

### Task 1: Add `FlpStorageOperations` DI Abstraction

**Files:**
- Modify: `packages/api-aco/src/features/folder/shared/abstractions.ts`

- [ ] **Step 1: Add the FlpStorageOperations abstraction token**

Add after the existing `FilterStorageOperations` block in `packages/api-aco/src/features/folder/shared/abstractions.ts`:

```ts
export const FlpStorageOperations =
    createAbstraction<IAcoStorageOperations["flp"]>("FlpStorageOperations");

export namespace FlpStorageOperations {
    export type Interface = IAcoStorageOperations["flp"];
}
```

The `IAcoStorageOperations` import is already present in this file.

- [ ] **Step 2: Export from the public API**

Add to `packages/api-aco/src/exports/api/aco/folder.ts`:

```ts
export { FlpStorageOperations } from "~/features/folder/shared/abstractions.js";
```

- [ ] **Step 3: Re-export from `webiny` package**

In `packages/webiny/src/api/aco/folder.ts`, add after the existing `FilterStorageOperations` export:

```ts
export { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-aco/src/features/folder/shared/abstractions.ts packages/api-aco/src/exports/api/aco/folder.ts packages/webiny/src/api/aco/folder.ts
git commit -m "feat(api-aco): add FlpStorageOperations DI abstraction"
```

---

### Task 2: Create the `api-aco-ddb` Package

**Files:**
- Create: `packages/api-aco-ddb/package.json`
- Create: `packages/api-aco-ddb/tsconfig.json`
- Create: `packages/api-aco-ddb/tsconfig.build.json`
- Create: `packages/api-aco-ddb/webiny.config.js`
- Create: `packages/api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts`
- Create: `packages/api-aco-ddb/src/index.ts`

- [ ] **Step 1: Create `package.json`**

Create `packages/api-aco-ddb/package.json`:

```json
{
  "name": "@webiny/api-aco-ddb",
  "version": "0.0.0",
  "type": "module",
  "keywords": [
    "@webiny/api-aco",
    "storage-operations",
    "dynamodb",
    "ddb",
    "sau:ddb"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git"
  },
  "description": "DynamoDB storage operations for @webiny/api-aco.",
  "author": "Webiny Ltd.",
  "license": "MIT",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "dependencies": {
    "@webiny/api-aco": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/db-dynamodb": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "6.0.3"
  },
  "publishConfig": {
    "access": "public"
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create `webiny.config.js`**

Create `packages/api-aco-ddb/webiny.config.js`:

```js
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
```

- [ ] **Step 3: Create `tsconfig.json`**

Create `packages/api-aco-ddb/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "references": [
    { "path": "../api-aco" },
    { "path": "../aws-sdk" },
    { "path": "../db-dynamodb" },
    { "path": "../error" },
    { "path": "../handler" },
    { "path": "../utils" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-aco/*": ["../api-aco/src/*"],
      "@webiny/api-aco": ["../api-aco/src"],
      "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
      "@webiny/aws-sdk": ["../aws-sdk/src"],
      "@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
      "@webiny/db-dynamodb": ["../db-dynamodb/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/handler/*": ["../handler/src/*"],
      "@webiny/handler": ["../handler/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.build.json`**

Create `packages/api-aco-ddb/tsconfig.build.json`:

```json
{
  "extends": "../../tsconfig.build.json",
  "include": ["src"],
  "references": [
    { "path": "../api-aco/tsconfig.build.json" },
    { "path": "../aws-sdk/tsconfig.build.json" },
    { "path": "../db-dynamodb/tsconfig.build.json" },
    { "path": "../error/tsconfig.build.json" },
    { "path": "../handler/tsconfig.build.json" },
    { "path": "../utils/tsconfig.build.json" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-aco/*": ["../api-aco/src/*"],
      "@webiny/api-aco": ["../api-aco/src"],
      "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
      "@webiny/aws-sdk": ["../aws-sdk/src"],
      "@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
      "@webiny/db-dynamodb": ["../db-dynamodb/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/handler/*": ["../handler/src/*"],
      "@webiny/handler": ["../handler/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"]
    }
  }
}
```

- [ ] **Step 5: Move the FLP storage class**

Create `packages/api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts`.

Copy the full content of the `FolderLevelPermissionsStorageOperations` class from `packages/api-aco/src/flp/flp.so.ts` (lines 34–239), plus the helper interfaces `CreateKeysParams` and `CreateGsiKeysParams` (lines 21–31).

Update the imports at the top:

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    createStandardEntity,
    createTable
} from "@webiny/db-dynamodb";
import { WebinyError } from "@webiny/error";
import type {
    AcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "@webiny/api-aco/types.js";
import { executeWithRetry } from "@webiny/utils";
```

Export the class (it was module-private before):

```ts
export class FolderLevelPermissionsStorageOperations implements AcoFolderLevelPermissionsStorageOperations {
    // ... identical body
}
```

Also export the config interface:

```ts
export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
}
```

- [ ] **Step 6: Create `index.ts` with the registration plugin**

Create `packages/api-aco-ddb/src/index.ts`:

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import {
    FolderLevelPermissionsStorageOperations
} from "./FolderLevelPermissionsStorageOperations.js";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

interface RegisterAcoDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerAcoDdbStorageOperations = (
    params: RegisterAcoDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const flpStorageOperations = new FolderLevelPermissionsStorageOperations({
            documentClient: params.documentClient
        });

        context.container.registerInstance(FlpStorageOperations, flpStorageOperations);
    });
};
```

- [ ] **Step 7: Run `yarn` to link the new package**

```bash
yarn > /dev/null 2>&1
```

- [ ] **Step 8: Build the new package**

```bash
yarn build -p @webiny/api-aco-ddb 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 9: Commit**

```bash
git add packages/api-aco-ddb/
git commit -m "feat(api-aco-ddb): create DynamoDB storage package for api-aco"
```

---

### Task 3: Clean Up `api-aco` — Remove DDB Dependencies

**Files:**
- Delete: `packages/api-aco/src/createAcoStorageOperations.ts`
- Modify: `packages/api-aco/src/flp/index.ts`
- Modify: `packages/api-aco/src/filter/filter.so.ts`
- Modify: `packages/api-aco/src/utils/createOperationsWrapper.ts`
- Modify: `packages/api-aco/src/index.ts`
- Modify: `packages/api-aco/src/createAcoContext.ts`
- Modify: `packages/api-aco/package.json`
- Modify: `packages/api-aco/tsconfig.json`
- Modify: `packages/api-aco/tsconfig.build.json`

- [ ] **Step 1: Delete `createAcoStorageOperations.ts`**

Delete `packages/api-aco/src/createAcoStorageOperations.ts`.

- [ ] **Step 2: Remove `flp.so` barrel export**

In `packages/api-aco/src/flp/index.ts`, remove the line:

```ts
export * from "./flp.so.js";
```

Keep:
```ts
export * from "./flp.crud.js";
export * from "./tasks/index.js";
```

- [ ] **Step 3: Fix `filter/filter.so.ts` — replace deleted import**

In `packages/api-aco/src/filter/filter.so.ts`, replace line 4:

```ts
import type { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations.js";
```

With a local interface and the needed imports:

```ts
import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { Security } from "@webiny/api-core/types/security.js";
import type { Container } from "@webiny/di";

interface CreateFilterOperationsParams {
    cms: HeadlessCms;
    security: Security;
    container: Container;
}
```

Update the function signature from `CreateAcoStorageOperationsParams` to `CreateFilterOperationsParams`:

```ts
export const createFilterOperations = (
    params: CreateFilterOperationsParams
): AcoFilterStorageOperations => {
```

- [ ] **Step 4: Fix `utils/createOperationsWrapper.ts` — replace deleted import**

Replace the entire file `packages/api-aco/src/utils/createOperationsWrapper.ts` with:

```ts
import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { Security } from "@webiny/api-core/types/security.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";

interface CreateOperationsWrapperParams {
    cms: HeadlessCms;
    security: Security;
    modelName: string;
}

export const createOperationsWrapper = (params: CreateOperationsWrapperParams) => {
    const { security, cms, modelName } = params;

    const withModel = async <TResult>(
        cb: (model: CmsModel) => Promise<TResult>
    ): Promise<TResult> => {
        const model = await security.withoutAuthorization(() => {
            return cms.getModel(modelName);
        });

        if (!model) {
            throw new WebinyError(`Could not find "${modelName}" model.`, "MODEL_NOT_FOUND_ERROR");
        }

        return cb(model);
    };

    return { withModel };
};
```

- [ ] **Step 5: Clean up `index.ts` — remove `documentClient` param**

Replace `packages/api-aco/src/index.ts` with:

```ts
import { createAcoContext } from "~/createAcoContext.js";
import { createAcoGraphQL } from "~/createAcoGraphQL.js";
import { createAcoTasks } from "~/createAcoTasks.js";

export { FILTER_MODEL_ID } from "./filter/filter.model.js";

export const createAco = () => {
    return [createAcoContext(), ...createAcoGraphQL(), createAcoTasks()];
};

export * from "./folder/createFolderModelModifier.js";
```

- [ ] **Step 6: Rewrite `createAcoContext.ts` — resolve FLP SO from container**

Replace `packages/api-aco/src/createAcoContext.ts` with the following. Key changes: no `documentClient` param, no `CreateAcoContextParams` interface, FLP SO resolved from container, filter SO created inline.

```ts
import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createFilterOperations } from "~/filter/filter.so.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import type { AcoContext } from "~/types.js";
import { createFlpCrudMethods } from "~/flp/index.js";
import {
    FolderLevelPermissions,
    FolderLevelPermissionsFeature
} from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderFeature } from "~/features/folder/UpdateFolder/index.js";
import { DeleteFolderFeature } from "~/features/folder/DeleteFolder/index.js";
import { CreateFolderFeature } from "~/features/folder/CreateFolder/index.js";
import { GetFolderFeature } from "~/features/folder/GetFolder/index.js";
import { ListFoldersFeature } from "~/features/folder/ListFolders/index.js";
import { GetFolderHierarchyFeature } from "~/features/folder/GetFolderHierarchy/index.js";
import { GetAncestorsFeature } from "~/features/folder/GetAncestors/index.js";
import { UpdateFlpOnFolderUpdatedFeature } from "~/features/flp/UpdateFlpOnFolderUpdated/index.js";
import { DeleteFlpOnFolderDeletedFeature } from "~/features/flp/DeleteFlpOnFolderDeleted/index.js";
import { EnsureHcmsFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureHcmsFolderIsEmptyOnDelete/index.js";
import { CreateFlpFeature } from "~/features/flp/CreateFlp/index.js";
import { DeleteFlpFeature } from "~/features/flp/DeleteFlp/index.js";
import { UpdateFlpFeature } from "~/features/flp/UpdateFlp/index.js";
import { EnsureFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureFolderIsEmptyOnDelete/index.js";
import {
    FilterStorageOperations,
    FlpStorageOperations
} from "~/features/folder/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folder/ListFolderLevelPermissionsTargets/feature.js";
import { Tenant } from "@webiny/api-core/types/tenancy";
import { CmsFlpFeature } from "~/features/cms/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FolderModel as FolderModelAbstraction } from "~/domain/folder/abstractions.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/index.js";
import { EnsureFolderIsEmptyFeature } from "~/features/folder/EnsureFolderIsEmpty/feature.js";
import { FOLDER_MODEL_ID, FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { AcoStorageOperations } from "~/types.js";

const setupAcoContext = async (context: AcoContext): Promise<void> => {
    const { tenancy, security, cms, container } = context;

    const getModel = container.resolve(GetModelUseCase);

    await security.withoutAuthorization(async () => {
        const folderModel = await getModel.execute(FOLDER_MODEL_ID);
        container.registerInstance(FolderModelAbstraction, folderModel.value);
    });

    const getTenant = (): Tenant => {
        return tenancy.getCurrentTenant();
    };

    const flpSo = container.resolve(FlpStorageOperations);
    const filterSo = createFilterOperations({ cms, security, container });

    const storageOperations: AcoStorageOperations = {
        filter: filterSo,
        flp: flpSo
    };

    const flpCrudMethods = createFlpCrudMethods({
        getTenant,
        storageOperations
    });

    FolderLevelPermissionsFeature.register(container);

    container.registerInstance(FilterStorageOperations, storageOperations.filter);

    CreateFolderFeature.register(container);
    UpdateFolderFeature.register(container);
    DeleteFolderFeature.register(container);
    GetFolderFeature.register(container);
    ListFoldersFeature.register(container);
    ListFolderLevelPermissionsTargetsFeature.register(container);
    GetFolderHierarchyFeature.register(container);
    GetAncestorsFeature.register(container);
    EnsureFolderIsEmptyFeature.register(container);

    CreateFlpFeature.register(container, { context });
    UpdateFlpFeature.register(container, { context });
    DeleteFlpFeature.register(container, { context });
    ListFlpsFeature.register(container, flpCrudMethods);
    GetFlpFeature.register(container, flpCrudMethods);

    CreateFlpOnFolderCreatedFeature.register(container);
    UpdateFlpOnFolderUpdatedFeature.register(container);
    DeleteFlpOnFolderDeletedFeature.register(container);

    EnsureFolderIsEmptyOnDeleteFeature.register(container);
    EnsureHcmsFolderIsEmptyOnDeleteFeature.register(container);

    const folderLevelPermissions = container.resolve(FolderLevelPermissions);

    context.aco = {
        filter: createFilterCrudMethods({
            container,
            getTenant,
            storageOperations,
            folderLevelPermissions
        }),
        flp: flpCrudMethods
    };

    if (context.wcp.canUseFolderLevelPermissions()) {
        CmsFlpFeature.register(container);
    }
};

export const createAcoContext = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(FolderModel);
        context.container.register(FilterPrivateModel);
    });

    const acoContextPlugin = new ContextPlugin<AcoContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context);
        });
    });

    acoContextPlugin.name = "aco.createContext";

    return [acoContextPlugin, modelsPlugin];
};
```

- [ ] **Step 7: Remove DDB deps from `package.json`**

In `packages/api-aco/package.json`, remove these two lines from `dependencies`:

```json
"@webiny/aws-sdk": "0.0.0",
"@webiny/db-dynamodb": "0.0.0",
```

Add `@webiny/api-aco-ddb` to `devDependencies` (needed by tests):

```json
"@webiny/api-aco-ddb": "0.0.0",
```

- [ ] **Step 8: Update `tsconfig.build.json`**

In `packages/api-aco/tsconfig.build.json`, remove from `references`:

```json
{ "path": "../aws-sdk/tsconfig.build.json" },
{ "path": "../db-dynamodb/tsconfig.build.json" },
```

Do NOT add `api-aco-ddb` to `references` — it would create a circular reference (`api-aco` → `api-aco-ddb` → `api-aco`).

Remove from `compilerOptions.paths`:

```json
"@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
"@webiny/aws-sdk": ["../aws-sdk/src"],
"@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
"@webiny/db-dynamodb": ["../db-dynamodb/src"],
```

- [ ] **Step 9: Update `tsconfig.json`**

In `packages/api-aco/tsconfig.json`, remove from `references`:

```json
{ "path": "../aws-sdk" },
{ "path": "../db-dynamodb" },
```

Do NOT add `api-aco-ddb` to `references` — circular reference. Only add to `compilerOptions.paths` so test files can resolve the import.

Remove from `compilerOptions.paths`:

```json
"@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
"@webiny/aws-sdk": ["../aws-sdk/src"],
"@webiny/db-dynamodb/*": ["../db-dynamodb/src/*"],
"@webiny/db-dynamodb": ["../db-dynamodb/src"],
```

Add to `compilerOptions.paths`:

```json
"@webiny/api-aco-ddb/*": ["../api-aco-ddb/src/*"],
"@webiny/api-aco-ddb": ["../api-aco-ddb/src"],
```

- [ ] **Step 10: Build api-aco to verify**

```bash
yarn build -p @webiny/api-aco 2>&1 | tail -30
```

Expected: successful build with zero DDB references.

- [ ] **Step 11: Commit**

```bash
git add packages/api-aco/
git commit -m "refactor(api-aco): remove DynamoDB dependencies, resolve FLP SO from DI container"
```

---

### Task 4: Update App Templates

**Files:**
- Modify: `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/appTemplates/api/graphql/package.json`

- [ ] **Step 1: Update the DDB app template**

In `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`:

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace:

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

- [ ] **Step 2: Update the OpenSearch app template**

In `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`:

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace:

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

- [ ] **Step 3: Update the SQLite app template**

In `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts`:

Remove:

```ts
createAco({ knex }),
```

Replace with:

```ts
createAco(),
```

- [ ] **Step 4: Add `@webiny/api-aco-ddb` to the DDB template's `package.json`**

In `packages/project-aws/_templates/appTemplates/api/graphql/package.json`, add to `dependencies`:

```json
"@webiny/api-aco-ddb": "0.0.0",
```

- [ ] **Step 5: Commit**

```bash
git add packages/project-aws/
git commit -m "refactor: update app templates to use api-aco-ddb plugin"
```

---

### Task 5: Update Test Handler Files

**Files:**
- Modify: `packages/api-aco/__tests__/utils/useHandler.ts`
- Modify: `packages/api-aco/__tests__/utils/useGraphQlHandler.ts`
- Modify: `packages/api-headless-cms-aco/__tests__/utils/useGraphQlHandler.ts`
- Modify: `packages/api-file-manager-aco/__tests__/utils/useGraphQlHandler.ts`
- Modify: `packages/api-audit-logs/__tests__/helpers/handlerCore.ts`

Each file gets the same mechanical change: add import for `registerAcoDdbStorageOperations`, replace `createAco({ documentClient })` with `registerAcoDdbStorageOperations({ documentClient }), createAco()` in the plugins array.

- [ ] **Step 1: Update `api-aco/__tests__/utils/useHandler.ts`**

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace (line 43):

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

- [ ] **Step 2: Update `api-aco/__tests__/utils/useGraphQlHandler.ts`**

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace (line 88):

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

- [ ] **Step 3: Update `api-headless-cms-aco/__tests__/utils/useGraphQlHandler.ts`**

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace (line 85):

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

Also add `@webiny/api-aco-ddb` to `packages/api-headless-cms-aco/package.json` `devDependencies`:

```json
"@webiny/api-aco-ddb": "0.0.0",
```

- [ ] **Step 4: Update `api-file-manager-aco/__tests__/utils/useGraphQlHandler.ts`**

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace (line 76):

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

Also add `@webiny/api-aco-ddb` to `packages/api-file-manager-aco/package.json` `devDependencies`:

```json
"@webiny/api-aco-ddb": "0.0.0",
```

- [ ] **Step 5: Update `api-audit-logs/__tests__/helpers/handlerCore.ts`**

Add import:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
```

Replace (line 106):

```ts
createAco({ documentClient }),
```

With:

```ts
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

Also add `@webiny/api-aco-ddb` to `packages/api-audit-logs/package.json` `devDependencies`:

```json
"@webiny/api-aco-ddb": "0.0.0",
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-aco/__tests__/ packages/api-headless-cms-aco/ packages/api-file-manager-aco/ packages/api-audit-logs/
git commit -m "refactor: update test handlers to use api-aco-ddb plugin"
```

---

### Task 6: Run Pre-Commit Checks and Final Build

- [ ] **Step 1: Install deps**

```bash
yarn > /dev/null 2>&1
```

- [ ] **Step 2: Generate tsconfig files**

```bash
node scripts/generateTsConfigsInPackages.js
```

- [ ] **Step 3: Sync dependencies**

```bash
yarn adio
yarn webiny sync-dependencies
```

- [ ] **Step 4: Format and lint**

```bash
yarn format > /dev/null 2>&1
yarn lint
```

- [ ] **Step 5: Build both packages**

```bash
yarn build -p @webiny/api-aco-ddb 2>&1 | tail -30
yarn build -p @webiny/api-aco 2>&1 | tail -30
```

- [ ] **Step 6: Verify no DDB references remain in api-aco src**

```bash
grep -rn "dynamodb\|DynamoDBDocument\|db-dynamodb\|aws-sdk" packages/api-aco/src/ --include="*.ts"
```

Expected: no output.

- [ ] **Step 7: Run api-aco tests**

```bash
yarn test packages/api-aco 2>&1 | tail -50
```

Expected: all tests pass.

- [ ] **Step 8: Stage and commit**

```bash
git add .
git commit -m "chore: run pre-commit checks after api-aco-ddb split"
```
