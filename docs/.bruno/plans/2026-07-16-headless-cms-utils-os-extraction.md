# api-headless-cms-utils-os Extraction Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract shared OpenSearch query infrastructure from `api-headless-cms-ddb-es` into new `api-headless-cms-utils-os` package.

**Architecture:** Pure file move. ~75 files (~3,200 lines) move from `ddb-es` to `utils-os`. Internal `~/` imports remain valid since all extracted files reference each other. Only `ddb-es` import paths change (from `~/` local to `@webiny/api-headless-cms-utils-os/`). Zero logic changes.

**Tech Stack:** `@webiny/feature` (DI), `@webiny/api-opensearch`, `@webiny/api-headless-cms`, vitest

## Global Constraints

- Package versions are `"0.0.0"`
- Import paths use `.js` extensions (ESM)
- `~/` path alias resolves to `./src/*` via tsconfig
- No logic changes in moved files — pure extraction
- All existing ddb-es tests must pass after extraction
- No AWS/DDB imports in utils-os

**Spec:** `docs/.bruno/specs/2026-07-16-headless-cms-pg-os-design.md`

## Dependency Graph

```
Task 1 (scaffold)
  ├── Task 2  (CmsEntryOpenSearchIndex)         ─┐
  ├── Task 3  (CmsEntryOpenSearchBodyModifier)    │
  ├── Task 4  (CmsEntryOpenSearchSortModifier)    │
  ├── Task 5  (CmsEntryOpenSearchQueryModifier)   │
  ├── Task 6  (CmsEntryOpenSearchFullTextSearch)  │ ALL PARALLEL
  ├── Task 7  (CmsEntryOpenSearchValuesModifier)  │
  ├── Task 8  (CmsEntryOpenSearchFieldIndex)      │
  ├── Task 9  (CmsEntryOpenSearchFilter)          │
  ├── Task 10 (CmsEntryOpenSearchValueSearch)     │
  ├── Task 11 (values + helpers)                  │
  ├── Task 12 (configurations + elasticsearch)    │
  ├── Task 13 (operations/entry/elasticsearch)    │
  └── Task 14 (transformEntryToIndex)            ─┘
        │
        ▼
  Task 15 (barrel export + re-exports)
        │
        ├── Task 16 (update ddb-es feature.ts)        ─┐
        ├── Task 17 (update ddb-es entry ops imports)   │ PARALLEL
        ├── Task 18 (update ddb-es opensearch.ts)       │
        └── Task 19 (update ddb-es package.json/tsconfig)─┘
              │
              ▼
        Task 20 (delete moved files from ddb-es)
              │
              ▼
        Task 21 (build + test)
```

---

### Task 1: Scaffold utils-os Package

**Files:**
- Create: `packages/api-headless-cms-utils-os/package.json`
- Create: `packages/api-headless-cms-utils-os/tsconfig.json`
- Create: `packages/api-headless-cms-utils-os/tsconfig.build.json`
- Create: `packages/api-headless-cms-utils-os/webiny.config.js`
- Create: `packages/api-headless-cms-utils-os/vitest.config.ts`
- Create: `packages/api-headless-cms-utils-os/ci.config.json`

**Interfaces:**
- Consumes: nothing
- Produces: empty package that builds; `~/` path alias resolves to `./src/*`

- [ ] **Step 1: Create package.json**

```json
{
    "name": "@webiny/api-headless-cms-utils-os",
    "version": "0.0.0",
    "type": "module",
    "exports": {
        ".": "./index.js",
        "./*": "./*"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/webiny/webiny-js.git",
        "directory": "packages/api-headless-cms-utils-os"
    },
    "description": "Shared OpenSearch query infrastructure for Headless CMS storage packages.",
    "license": "MIT",
    "author": "Webiny Ltd.",
    "dependencies": {
        "@webiny/api-headless-cms": "0.0.0",
        "@webiny/api-opensearch": "0.0.0",
        "@webiny/error": "0.0.0",
        "@webiny/feature": "0.0.0"
    },
    "devDependencies": {
        "@webiny/build-tools": "0.0.0",
        "typescript": "^7.0.2"
    },
    "publishConfig": {
        "access": "public"
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
        { "path": "../api-headless-cms" },
        { "path": "../api-opensearch" },
        { "path": "../error" },
        { "path": "../feature" }
    ],
    "compilerOptions": {
        "rootDirs": ["./src", "./__tests__"],
        "outDir": "./dist",
        "declarationDir": "./dist",
        "paths": {
            "~/*": ["./src/*"],
            "~tests/*": ["./__tests__/*"],
            "@webiny/api-headless-cms/*": ["../api-headless-cms/src/*"],
            "@webiny/api-headless-cms": ["../api-headless-cms/src"],
            "@webiny/api-opensearch/*": ["../api-opensearch/src/*"],
            "@webiny/api-opensearch": ["../api-opensearch/src"],
            "@webiny/error/*": ["../error/src/*"],
            "@webiny/error": ["../error/src"],
            "@webiny/feature/*": ["../feature/src/*"],
            "@webiny/feature": ["../feature/src"]
        }
    }
}
```

- [ ] **Step 3: Create tsconfig.build.json**

Same as tsconfig.json but with `"include": ["src"]`, `"rootDir": "./src"` instead of `rootDirs`, and no test-related paths. Follow pattern from `packages/api-sync-ddb-to-opensearch/tsconfig.build.json`.

- [ ] **Step 4: Create webiny.config.js**

```js
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({ path: import.meta.dirname });
};
```

- [ ] **Step 6: Create ci.config.json**

```json
{
    "$schema": "../../.github/workflows/ci.config.schema.json"
}
```

- [ ] **Step 7: Create placeholder src/index.ts**

```ts
// Barrel export — populated after all features are moved.
```

- [ ] **Step 8: Install deps**

Run: `yarn > /dev/null 2>&1`

- [ ] **Step 9: Verify build**

Run: `yarn build -p @webiny/api-headless-cms-utils-os 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add packages/api-headless-cms-utils-os/
git commit -m "feat(api-headless-cms-utils-os): scaffold new package"
```

---

### Task 2: Move CmsEntryOpenSearchIndex

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchIndex/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchIndex/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchIndex` abstraction token, `BaseOpenSearchIndex` implementation, `CmsEntryOpenSearchIndexFeature`

Contains 4 files: `abstractions.ts`, `BaseOpenSearchIndex.ts`, `feature.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
mkdir -p packages/api-headless-cms-utils-os/src/features
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchIndex packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Verify no DDB imports**

```bash
grep -r "@webiny/db-dynamodb\|@webiny/aws-sdk" packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchIndex/ 2>/dev/null
```
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchIndex/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchIndex"
```

---

### Task 3: Move CmsEntryOpenSearchBodyModifier

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchBodyModifier/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyModifier/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchBodyModifier` abstraction token

Contains 2 files: `abstractions.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchBodyModifier packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyModifier/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchBodyModifier"
```

---

### Task 4: Move CmsEntryOpenSearchSortModifier

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchSortModifier/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchSortModifier/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchSortModifier` abstraction token

Contains 2 files: `abstractions.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchSortModifier packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchSortModifier/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchSortModifier"
```

---

### Task 5: Move CmsEntryOpenSearchQueryModifier

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchQueryModifier/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchQueryModifier/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchQueryModifier` abstraction token

Contains 2 files: `abstractions.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchQueryModifier packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchQueryModifier/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchQueryModifier"
```

---

### Task 6: Move CmsEntryOpenSearchFullTextSearch

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFullTextSearch/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFullTextSearch/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchFullTextSearch` abstraction token

Contains 2 files: `abstractions.ts`, `index.ts`. Note: `abstractions.ts` imports `~/operations/entry/elasticsearch/types.js` — this import stays valid because Task 13 moves that file to the same `~/` location in utils-os.

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFullTextSearch packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFullTextSearch/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchFullTextSearch"
```

---

### Task 7: Move CmsEntryOpenSearchValuesModifier

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchValuesModifier/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchValuesModifier/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchValuesModifier` abstraction token

Contains 2 files: `abstractions.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchValuesModifier packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchValuesModifier/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchValuesModifier"
```

---

### Task 8: Move CmsEntryOpenSearchFieldIndex

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFieldIndex/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFieldIndex/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `CmsEntryOpenSearchFieldIndex` abstraction, `CmsEntryOpenSearchFieldIndexRegistry`, `CmsEntryOpenSearchFieldIndexFeature`, 9 field indexer implementations (Default, DateTime, Number, LongText, TextCompressed, RichText, TextEncrypted, Json, Object)

Contains 15 files: `abstractions/` (2 files), `fields/` (9 field indexers), `CmsEntryOpenSearchFieldIndexRegistry.ts`, `constants.ts`, `feature.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFieldIndex packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Verify no DDB imports**

```bash
grep -r "@webiny/db-dynamodb\|@webiny/aws-sdk" packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFieldIndex/ 2>/dev/null
```
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFieldIndex/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchFieldIndex (9 indexers + registry)"
```

---

### Task 9: Move CmsEntryOpenSearchFilter

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFilter/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFilter/`

**Interfaces:**
- Consumes: Task 1 scaffold. Note: `CmsEntryOpenSearchFilter` abstraction imports `~/operations/entry/elasticsearch/types.js` — stays valid after Task 13 moves that file.
- Produces: `CmsEntryOpenSearchFilter` abstraction, `CmsEntryOpenSearchFilterRegistry`, `CmsEntryOpenSearchFilterFeature`, 3 filter implementations (Default, Object, Ref)

Contains 9 files: `abstractions/` (2 files), `fields/` (3 filters), `CmsEntryOpenSearchFilterRegistry.ts`, `constants.ts`, `feature.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFilter packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFilter/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchFilter (3 filters + registry)"
```

---

### Task 10: Move CmsEntryOpenSearchValueSearch

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchValueSearch/` → `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchValueSearch/`

**Interfaces:**
- Consumes: Task 1 scaffold. Note: `SearchableJsonSearch.ts` imports `~/values/NoValueContainer.js` — stays valid after Task 11 moves that file.
- Produces: `CmsEntryOpenSearchValueSearch` abstraction, `CmsEntryOpenSearchValueSearchRegistry`, `CmsEntryOpenSearchValueSearchFeature`, 3 search implementations (Ref, Time, SearchableJson)

Contains 8 files: `abstractions/` (2 files), `fields/` (3 searchers), `CmsEntryOpenSearchValueSearchRegistry.ts`, `feature.ts`, `index.ts`

- [ ] **Step 1: Copy directory**

```bash
cp -r packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchValueSearch packages/api-headless-cms-utils-os/src/features/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchValueSearch/
git commit -m "feat(api-headless-cms-utils-os): move CmsEntryOpenSearchValueSearch (3 searchers + registry)"
```

---

### Task 11: Move values + helpers

**Files:**
- Copy: `packages/api-headless-cms-ddb-es/src/values/NoValueContainer.ts` → `packages/api-headless-cms-utils-os/src/values/NoValueContainer.ts`
- Copy: `packages/api-headless-cms-ddb-es/src/helpers/entryIndexHelpers.ts` → `packages/api-headless-cms-utils-os/src/helpers/entryIndexHelpers.ts`
- Copy: `packages/api-headless-cms-ddb-es/src/helpers/fieldIdentifier.ts` → `packages/api-headless-cms-utils-os/src/helpers/fieldIdentifier.ts`
- Copy: `packages/api-headless-cms-ddb-es/src/helpers/index.ts` → `packages/api-headless-cms-utils-os/src/helpers/index.ts`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `NoValueContainer` class, `prepareEntryToIndex()` function, `extractEntriesFromIndex()` function, `getFieldIdentifier()` function. `helpers/index.ts` is a barrel re-exporting both helper files — used by `ObjectFieldIndex`, `entry/index.ts`, and `transformEntryToIndex.ts`.

`entryIndexHelpers.ts` imports `~/helpers/fieldIdentifier.js` — stays valid since both files move together.

- [ ] **Step 1: Copy files**

```bash
mkdir -p packages/api-headless-cms-utils-os/src/values
mkdir -p packages/api-headless-cms-utils-os/src/helpers
cp packages/api-headless-cms-ddb-es/src/values/NoValueContainer.ts packages/api-headless-cms-utils-os/src/values/
cp packages/api-headless-cms-ddb-es/src/helpers/entryIndexHelpers.ts packages/api-headless-cms-utils-os/src/helpers/
cp packages/api-headless-cms-ddb-es/src/helpers/fieldIdentifier.ts packages/api-headless-cms-utils-os/src/helpers/
cp packages/api-headless-cms-ddb-es/src/helpers/index.ts packages/api-headless-cms-utils-os/src/helpers/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/values/ packages/api-headless-cms-utils-os/src/helpers/
git commit -m "feat(api-headless-cms-utils-os): move values + helpers"
```

---

### Task 12: Move configurations + elasticsearch

**Files:**
- Copy: `packages/api-headless-cms-ddb-es/src/configurations.ts` → `packages/api-headless-cms-utils-os/src/configurations.ts`
- Copy directory: `packages/api-headless-cms-ddb-es/src/elasticsearch/` → `packages/api-headless-cms-utils-os/src/elasticsearch/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `configurations` (index naming + settings), `createElasticsearchIndex()`, `deleteElasticsearchIndex()`

`configurations.ts` imports `~/features/CmsEntryOpenSearchIndex/index.js` — stays valid after Task 2.
`createElasticsearchIndex.ts` imports `~/configurations.js` — stays valid since both move together.

- [ ] **Step 1: Copy files**

```bash
cp packages/api-headless-cms-ddb-es/src/configurations.ts packages/api-headless-cms-utils-os/src/
mkdir -p packages/api-headless-cms-utils-os/src/elasticsearch
cp -r packages/api-headless-cms-ddb-es/src/elasticsearch/* packages/api-headless-cms-utils-os/src/elasticsearch/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/configurations.ts packages/api-headless-cms-utils-os/src/elasticsearch/
git commit -m "feat(api-headless-cms-utils-os): move configurations + elasticsearch index lifecycle"
```

---

### Task 13: Move operations/entry/elasticsearch

**Files:**
- Copy directory: `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/` → `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: Query body builder (`body.ts`), field mapping (`fields.ts`), filter exec (`filtering/`), sort builder (`sort.ts`), FTS (`fullTextSearch.ts`), initial query template, keyword handling, value transform, operators, types, error handling

Contains ~22 files including `fields/` (4 system field files), `filtering/` (6 files), `plugins/` (1 file), and standalone modules (`body.ts`, `fields.ts`, `sort.ts`, `fullTextSearch.ts`, `fullTextSearchFields.ts`, `initialQuery.ts`, `keyword.ts`, `transformValueForSearch.ts`, `shouldIgnoreEsResponseError.ts`, `assignMinimumShouldMatchToQuery.ts`, `types.ts`). This is the hub module — `body.ts` imports from 13 other extracted files. All imports use `~/` paths that remain valid since the entire extraction set moves together.

- [ ] **Step 1: Copy directory**

```bash
mkdir -p packages/api-headless-cms-utils-os/src/operations/entry
cp -r packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch packages/api-headless-cms-utils-os/src/operations/entry/
```

- [ ] **Step 2: Verify no DDB imports**

```bash
grep -r "@webiny/db-dynamodb\|@webiny/aws-sdk\|@webiny/db/" packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/ 2>/dev/null
```
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/
git commit -m "feat(api-headless-cms-utils-os): move operations/entry/elasticsearch (22 files)"
```

---

### Task 14: Move transformEntryToIndex

**Files:**
- Copy: `packages/api-headless-cms-ddb-es/src/operations/entry/transformations/transformEntryToIndex.ts` → `packages/api-headless-cms-utils-os/src/operations/entry/transformations/transformEntryToIndex.ts`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `transformEntryToIndex()` function — strips storage-specific keys, returns OS-ready entry shape

Imports `~/features/CmsEntryOpenSearchFieldIndex/index.js` — stays valid after Task 8.

- [ ] **Step 1: Copy file**

```bash
mkdir -p packages/api-headless-cms-utils-os/src/operations/entry/transformations
cp packages/api-headless-cms-ddb-es/src/operations/entry/transformations/transformEntryToIndex.ts packages/api-headless-cms-utils-os/src/operations/entry/transformations/
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/operations/entry/transformations/
git commit -m "feat(api-headless-cms-utils-os): move transformEntryToIndex"
```

---

### Task 15: Create Barrel Export and Re-exports

**Files:**
- Modify: `packages/api-headless-cms-utils-os/src/index.ts`
- Create: `packages/api-headless-cms-utils-os/src/exports/api/cms/opensearch.ts`

**Interfaces:**
- Consumes: Tasks 2-14 (all files must be in place)
- Produces: Public API surface for `@webiny/api-headless-cms-utils-os`

- [ ] **Step 1: Write barrel export**

Replace `packages/api-headless-cms-utils-os/src/index.ts`:

```ts
export { CmsEntryOpenSearchIndex, CmsEntryOpenSearchIndexFeature } from "./features/CmsEntryOpenSearchIndex/index.js";
export { CmsEntryOpenSearchBodyModifier } from "./features/CmsEntryOpenSearchBodyModifier/index.js";
export { CmsEntryOpenSearchSortModifier } from "./features/CmsEntryOpenSearchSortModifier/index.js";
export { CmsEntryOpenSearchQueryModifier } from "./features/CmsEntryOpenSearchQueryModifier/index.js";
export { CmsEntryOpenSearchFullTextSearch } from "./features/CmsEntryOpenSearchFullTextSearch/index.js";
export { CmsEntryOpenSearchValuesModifier } from "./features/CmsEntryOpenSearchValuesModifier/index.js";
export {
    CmsEntryOpenSearchFieldIndex,
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchFieldIndexFeature
} from "./features/CmsEntryOpenSearchFieldIndex/index.js";
export {
    CmsEntryOpenSearchFilter,
    CmsEntryOpenSearchFilterRegistry,
    CmsEntryOpenSearchFilterFeature
} from "./features/CmsEntryOpenSearchFilter/index.js";
export {
    CmsEntryOpenSearchValueSearch,
    CmsEntryOpenSearchValueSearchRegistry,
    CmsEntryOpenSearchValueSearchFeature
} from "./features/CmsEntryOpenSearchValueSearch/index.js";
```

Note: Read each feature's `index.ts` barrel first to match exact export names. The names above are based on the investigator's findings — verify each one exists.

- [ ] **Step 2: Create re-exports file**

Create `packages/api-headless-cms-utils-os/src/exports/api/cms/opensearch.ts`:

```ts
export {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchFieldIndex
} from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
export {
    CmsEntryOpenSearchFilterRegistry,
    CmsEntryOpenSearchFilter
} from "~/features/CmsEntryOpenSearchFilter/index.js";
export { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
export { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
export { CmsEntryOpenSearchQueryModifier } from "~/features/CmsEntryOpenSearchQueryModifier/index.js";
export {
    CmsEntryOpenSearchValueSearch,
    CmsEntryOpenSearchValueSearchRegistry
} from "~/features/CmsEntryOpenSearchValueSearch/index.js";
export { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
export { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";
export { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";
```

- [ ] **Step 3: Verify build**

Run:
```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-headless-cms-utils-os 2>&1 | tail -10
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-utils-os/src/
git commit -m "feat(api-headless-cms-utils-os): add barrel export and re-exports"
```

---

### Task 16: Update ddb-es feature.ts Imports

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/src/feature.ts`

**Interfaces:**
- Consumes: Task 15 (utils-os barrel export)
- Produces: Updated feature.ts importing from `@webiny/api-headless-cms-utils-os`

- [ ] **Step 1: Read feature.ts**

Read `packages/api-headless-cms-ddb-es/src/feature.ts` completely.

- [ ] **Step 2: Update imports**

Change all imports that reference extracted modules. The pattern:

```ts
// Before
import { X } from "~/features/CmsEntryOpenSearch.../index.js";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex.js";
import { deleteElasticsearchIndex } from "./elasticsearch/deleteElasticsearchIndex.js";
import { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
// etc.

// After
import { X } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearch.../index.js";
import { createElasticsearchIndex } from "@webiny/api-headless-cms-utils-os/elasticsearch/createElasticsearchIndex.js";
import { deleteElasticsearchIndex } from "@webiny/api-headless-cms-utils-os/elasticsearch/deleteElasticsearchIndex.js";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
// etc.
```

Only change imports for modules that moved to utils-os. Keep imports for DDB-specific modules (`~/definitions/`, `~/operations/`, `~/types.js`) as `~/`.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-ddb-es/src/feature.ts
git commit -m "refactor(api-headless-cms-ddb-es): update feature.ts imports to use utils-os"
```

---

### Task 17: Update ddb-es Operations + Tasks Imports

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/operations/entry/transformations/index.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/operations/entry/transformations/modifyEntryValues.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/operations/model/index.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/tasks/CreateElasticsearchIndexTask.ts`

**Interfaces:**
- Consumes: Task 15 (utils-os barrel export)
- Produces: Updated operations and tasks importing from `@webiny/api-headless-cms-utils-os`

- [ ] **Step 1: Update imports in operations/entry/index.ts**

Read `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts` completely (~2000 lines). Change ALL imports referencing extracted modules from `~/` to `@webiny/api-headless-cms-utils-os/`:

```ts
// Before (examples — find ALL such imports by grepping for ~/features/, ~/operations/entry/elasticsearch/, ~/helpers/, ~/configurations, ~/values/)
import { configurations } from "~/configurations.js";
import type { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
// etc.

// After
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
// etc.
```

Keep DDB-specific imports as `~/` (dataLoader, keys, recordType, transformEntryKeys, convertEntryKeys, definitions).

- [ ] **Step 2: Update imports in operations/entry/transformations/index.ts**

Change imports referencing extracted modules:

```ts
// Before
import { transformEntryToIndex } from "./transformEntryToIndex.js";
import type { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex/index.js";

// After
import { transformEntryToIndex } from "@webiny/api-headless-cms-utils-os/operations/entry/transformations/transformEntryToIndex.js";
import type { CmsEntryOpenSearchValuesModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValuesModifier/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
```

- [ ] **Step 3: Update imports in operations/entry/transformations/modifyEntryValues.ts**

```ts
// Before
import type { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";

// After
import type { CmsEntryOpenSearchValuesModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValuesModifier/index.js";
```

- [ ] **Step 4: Update imports in operations/model/index.ts**

```ts
// Before
import { configurations } from "~/configurations.js";

// After
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
```

- [ ] **Step 5: Update imports in tasks/CreateElasticsearchIndexTask.ts**

```ts
// Before
import { configurations } from "~/configurations.js";
import { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";

// After
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-headless-cms-ddb-es/src/operations/ packages/api-headless-cms-ddb-es/src/tasks/
git commit -m "refactor(api-headless-cms-ddb-es): update operations and tasks imports to use utils-os"
```

---

### Task 18: Update ddb-es Re-exports

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/src/exports/api/cms/opensearch.ts`

**Interfaces:**
- Consumes: Task 15 (utils-os barrel export)
- Produces: ddb-es re-exports pointing to utils-os

- [ ] **Step 1: Rewrite opensearch.ts**

Replace `packages/api-headless-cms-ddb-es/src/exports/api/cms/opensearch.ts` with re-exports from utils-os:

```ts
export {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchFieldIndex
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
export {
    CmsEntryOpenSearchFilterRegistry,
    CmsEntryOpenSearchFilter
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
export { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
export { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
export { CmsEntryOpenSearchQueryModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchQueryModifier/index.js";
export {
    CmsEntryOpenSearchValueSearch,
    CmsEntryOpenSearchValueSearchRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
export { CmsEntryOpenSearchFullTextSearch } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFullTextSearch/index.js";
export { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
export { CmsEntryOpenSearchValuesModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValuesModifier/index.js";
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-ddb-es/src/exports/api/cms/opensearch.ts
git commit -m "refactor(api-headless-cms-ddb-es): re-export OS abstractions from utils-os"
```

---

### Task 19: Update ddb-es Package Config

**Files:**
- Modify: `packages/api-headless-cms-ddb-es/package.json`
- Modify: `packages/api-headless-cms-ddb-es/tsconfig.json`
- Modify: `packages/api-headless-cms-ddb-es/tsconfig.build.json`

**Interfaces:**
- Consumes: Task 1 (utils-os package exists)
- Produces: ddb-es depends on utils-os

- [ ] **Step 1: Add dependency to package.json**

Add to `dependencies`:
```json
"@webiny/api-headless-cms-utils-os": "0.0.0"
```

- [ ] **Step 2: Add reference and path mappings to tsconfig.json**

Add to `references`:
```json
{ "path": "../api-headless-cms-utils-os" }
```

Add to `compilerOptions.paths`:
```json
"@webiny/api-headless-cms-utils-os/*": ["../api-headless-cms-utils-os/src/*"],
"@webiny/api-headless-cms-utils-os": ["../api-headless-cms-utils-os/src"]
```

- [ ] **Step 3: Add reference and path mappings to tsconfig.build.json**

Same additions as Step 2 but in the build config.

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-ddb-es/package.json packages/api-headless-cms-ddb-es/tsconfig.json packages/api-headless-cms-ddb-es/tsconfig.build.json
git commit -m "refactor(api-headless-cms-ddb-es): add utils-os dependency"
```

---

### Task 20: Delete Moved Files from ddb-es

**Files:**
- Delete: `packages/api-headless-cms-ddb-es/src/features/` (entire directory — all 9 subdirectories)
- Delete: `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/` (entire directory)
- Delete: `packages/api-headless-cms-ddb-es/src/operations/entry/transformations/transformEntryToIndex.ts`
- Delete: `packages/api-headless-cms-ddb-es/src/helpers/entryIndexHelpers.ts`
- Delete: `packages/api-headless-cms-ddb-es/src/helpers/fieldIdentifier.ts`
- Delete: `packages/api-headless-cms-ddb-es/src/values/` (entire directory)
- Delete: `packages/api-headless-cms-ddb-es/src/configurations.ts`
- Delete: `packages/api-headless-cms-ddb-es/src/elasticsearch/` (entire directory)

**Interfaces:**
- Consumes: Tasks 16-19 (all ddb-es imports updated, no file references `~/` paths to these files anymore)
- Produces: Clean ddb-es with no duplicate files

- [ ] **Step 1: Delete all moved files**

```bash
rm -rf packages/api-headless-cms-ddb-es/src/features/
rm -rf packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/
rm packages/api-headless-cms-ddb-es/src/operations/entry/transformations/transformEntryToIndex.ts
rm -rf packages/api-headless-cms-ddb-es/src/helpers/
rm -rf packages/api-headless-cms-ddb-es/src/values/
rm packages/api-headless-cms-ddb-es/src/configurations.ts
rm -rf packages/api-headless-cms-ddb-es/src/elasticsearch/
```

- [ ] **Step 2: Check for broken imports**

```bash
grep -r "~/features/CmsEntry\|~/operations/entry/elasticsearch\|~/helpers/entryIndexHelpers\|~/helpers/fieldIdentifier\|~/values/\|~/configurations\|~/elasticsearch/" packages/api-headless-cms-ddb-es/src/ 2>/dev/null
```
Expected: No output (all old `~/` imports should be updated to `@webiny/api-headless-cms-utils-os/`).

- [ ] **Step 3: Check for orphaned empty directories**

```bash
find packages/api-headless-cms-ddb-es/src/ -type d -empty 2>/dev/null
```
Delete any empty directories found.

- [ ] **Step 4: Commit**

```bash
git add -A packages/api-headless-cms-ddb-es/
git commit -m "refactor(api-headless-cms-ddb-es): delete files moved to utils-os"
```

---

### Task 21: Build and Test

**Files:**
- Potentially: any files needing fixup from build errors

**Interfaces:**
- Consumes: Tasks 1-20 (everything done)
- Produces: Green build + green tests

- [ ] **Step 1: Run pre-commit scripts**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

If any step fails, fix and rerun from beginning.

- [ ] **Step 2: Build utils-os**

Run: `yarn build -p @webiny/api-headless-cms-utils-os 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Build ddb-es**

Run: `yarn build -p @webiny/api-headless-cms-ddb-es 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Run ddb-es tests**

Run: `yarn test:os packages/api-headless-cms-ddb-es 2>&1 | tail -50`
Expected: All existing tests pass.

- [ ] **Step 5: Verify no AWS imports in utils-os**

```bash
grep -r "@webiny/aws-sdk\|@webiny/db-dynamodb\|@webiny/db\b" packages/api-headless-cms-utils-os/src/ 2>/dev/null
```
Expected: No output.

- [ ] **Step 6: Commit any fixups**

```bash
git add .
git commit -m "chore: final cleanup — formatting, lint, tsconfig, dependency sync"
```
