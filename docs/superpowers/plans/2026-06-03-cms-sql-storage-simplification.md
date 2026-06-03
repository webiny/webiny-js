# CMS SQL Storage Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `api-headless-cms-sql` to store entries as flat rows with JSON `values`, filtering in memory via shared utilities extracted from the DDB package.

**Architecture:** Three fixed-schema SQL tables (entries, groups, models). Entry rows have flat system columns + JSON values blob. List operations load all matching rows, then filter/sort/paginate in memory using `@webiny/db-utils`. The DDB package's filtering code is extracted to `db-utils`; DDB imports are repointed.

**Tech Stack:** Knex.js (SQLite), TypeScript, `@webiny/feature` DI, `@webiny/db-utils` (new shared package)

**Spec:** `docs/superpowers/specs/2026-06-03-cms-sql-storage-simplification-design.md`

---

## Phase 1: Create `@webiny/db-utils` Package

### Task 1: Package skeleton

**Files:**
- Create: `packages/db-utils/package.json`
- Create: `packages/db-utils/tsconfig.json`
- Create: `packages/db-utils/tsconfig.build.json`
- Create: `packages/db-utils/webiny.config.js`
- Create: `packages/db-utils/src/index.ts` (empty barrel — populated later)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/db-utils",
  "version": "0.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/db-utils"
  },
  "dependencies": {
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "date-fns": "^2.30.0",
    "dot-prop": "^9.0.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "typescript": "6.0.3"
  }
}
```

- [ ] **Step 2: Create tsconfig files**

Model after existing packages (e.g. `packages/db-dynamodb/tsconfig.json`). Include path aliases for `~/*` pointing to `./src/*`. Add project references to `@webiny/api-headless-cms`, `@webiny/error`, `@webiny/feature`, `@webiny/plugins`.

- [ ] **Step 3: Create `webiny.config.js`**

Copy from an existing package like `packages/db-dynamodb/webiny.config.js`.

- [ ] **Step 4: Create empty `src/index.ts`**

```typescript
/* Barrel exports — populated as modules are added. */
```

- [ ] **Step 5: Run yarn + generate tsconfigs**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 6: Verify the package builds**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore(db-utils): create package skeleton"
```

---

### Task 2: Move ValueFilter abstractions + implementations to db-utils

**Files:**
- Copy from: `packages/db-dynamodb/src/feature/ValueFilter/` (entire subtree)
- Create: `packages/db-utils/src/valueFilter/` (mirror structure)

The ValueFilter module is self-contained — abstractions, implementations, registry, and feature. No external deps beyond `@webiny/feature` and `@webiny/error`.

- [ ] **Step 1: Copy the ValueFilter directory**

Copy the entire `packages/db-dynamodb/src/feature/ValueFilter/` tree into `packages/db-utils/src/valueFilter/`, preserving structure:

```
packages/db-utils/src/valueFilter/
├── abstractions/
│   ├── ValueFilter.ts
│   ├── ValueFilterRegistry.ts
│   └── index.ts
├── filters/
│   ├── EqFilter.ts
│   ├── GtFilter.ts
│   ├── GteFilter.ts
│   ├── LtFilter.ts
│   ├── LteFilter.ts
│   ├── BetweenFilter.ts
│   ├── InFilter.ts
│   ├── AndInFilter.ts
│   ├── ContainsFilter.ts
│   ├── FuzzyFilter.ts
│   └── StartsWithFilter.ts
├── ValueFilterRegistry.ts
├── feature.ts
└── index.ts
```

- [ ] **Step 2: Update internal import paths**

All files use relative imports within the ValueFilter directory — these stay the same. No `~/` or `@webiny/db-dynamodb` imports exist within this subtree (they only import from `@webiny/feature/api`, `@webiny/error`, and `fuse.js`).

Verify: no file in the copied tree imports from `@webiny/db-dynamodb` or `~/`.

- [ ] **Step 3: Update the abstraction token names**

In `abstractions/ValueFilter.ts`, change:
```typescript
/* Old: */ createAbstraction<IValueFilter>("Db/DynamoDB/ValueFilter")
/* New: */ createAbstraction<IValueFilter>("Db/ValueFilter")
```

In `abstractions/ValueFilterRegistry.ts`, change:
```typescript
/* Old: */ createAbstraction<IValueFilterRegistry>("Db/DynamoDB/ValueFilterRegistry")
/* New: */ createAbstraction<IValueFilterRegistry>("Db/ValueFilterRegistry")
```

**Important:** The token name change means all consumers that register or resolve these abstractions must use the new tokens. This is handled in subsequent tasks.

- [ ] **Step 4: Export from db-utils barrel**

In `packages/db-utils/src/index.ts`:
```typescript
export { ValueFilter } from "./valueFilter/abstractions/ValueFilter.js";
export { ValueFilterRegistry } from "./valueFilter/abstractions/ValueFilterRegistry.js";
export { ValueFilterFeature } from "./valueFilter/feature.js";
```

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(db-utils): move ValueFilter abstractions and implementations from db-dynamodb"
```

---

### Task 3: Move plugin base classes to db-utils

**Files:**
- Copy from: `packages/api-headless-cms-ddb/src/plugins/CmsEntryFieldFilterPlugin.ts`
- Copy from: `packages/api-headless-cms-ddb/src/plugins/CmsEntryFieldSortingPlugin.ts`
- Copy from: `packages/api-headless-cms-ddb/src/plugins/CmsEntryFieldFilterPathPlugin.ts`
- Copy from: `packages/api-headless-cms-ddb/src/plugins/CmsFieldFilterValueTransformPlugin.ts`
- Copy from: `packages/api-headless-cms-ddb/src/types.ts` (extract `CmsFieldFilterValueTransformPlugin` interface only)
- Create: `packages/db-utils/src/plugins/` directory

- [ ] **Step 1: Copy `CmsEntryFieldFilterPathPlugin.ts`**

This file has zero DDB dependencies. Copy as-is to `packages/db-utils/src/plugins/CmsEntryFieldFilterPathPlugin.ts`.

Imports to verify are clean:
- `@webiny/error` — OK
- `@webiny/plugins/Plugin.js` — OK
- `@webiny/api-headless-cms/types/index.js` — OK

- [ ] **Step 2: Copy `CmsEntryFieldSortingPlugin.ts`**

Has one internal import: `type { Field } from "~/operations/entry/filtering/types.js"`. This file hasn't moved yet. For now, change to a relative import that will resolve once the filtering types are also in db-utils. Create a temporary type stub if needed, or move the types file first (see next step).

- [ ] **Step 3: Create the filtering types file first**

Copy `packages/api-headless-cms-ddb/src/operations/entry/filtering/types.ts` to `packages/db-utils/src/filtering/fields/types.ts`.

Update its import of `CreatePathCallable` from `~/plugins/index.js` to the local `../plugins/CmsEntryFieldFilterPathPlugin.js` (relative within db-utils).

Now `CmsEntryFieldSortingPlugin.ts` can import `Field` from `~/filtering/fields/types.js`.

- [ ] **Step 4: Extract `CmsFieldFilterValueTransformPlugin` interface**

This interface lives in `api-headless-cms-ddb/src/types.ts` alongside DDB-specific types. Extract just the interface and its param type into `packages/db-utils/src/plugins/CmsFieldFilterValueTransformPlugin.ts`.

The interface:
```typescript
import type { Plugin } from "@webiny/plugins/types.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export interface CmsFieldFilterValueTransformParams {
    field: Pick<CmsModelField, "fieldId" | "type" | "settings">;
    value: any;
}

export interface CmsFieldFilterValueTransformPlugin extends Plugin {
    type: "cms-field-filter-value-transform";
    fieldType: string;
    transform: (params: CmsFieldFilterValueTransformParams) => any;
}
```

Then copy the class implementation from `api-headless-cms-ddb/src/plugins/CmsFieldFilterValueTransformPlugin.ts`, updating its import of the interface to use the local one instead of `~/types.js`.

- [ ] **Step 5: Copy `CmsEntryFieldFilterPlugin.ts`**

This file imports `ValueFilterRegistry` from `@webiny/db-dynamodb/feature/ValueFilter/index.js`. Change to import from `~/valueFilter/abstractions/ValueFilterRegistry.js` (local db-utils path).

Also imports `Field` from `~/operations/entry/filtering/types.js` — change to `~/filtering/fields/types.js`.

Also imports `CmsFieldFilterValueTransformPlugin` from `~/types.js` — change to `~/plugins/CmsFieldFilterValueTransformPlugin.js`.

- [ ] **Step 6: Create barrel `packages/db-utils/src/plugins/index.ts`**

```typescript
export { CmsEntryFieldFilterPathPlugin } from "./CmsEntryFieldFilterPathPlugin.js";
export type { CreatePathCallable } from "./CmsEntryFieldFilterPathPlugin.js";
export type { CreatePathCallableParams } from "./CmsEntryFieldFilterPathPlugin.js";
export { CmsEntryFieldSortingPlugin } from "./CmsEntryFieldSortingPlugin.js";
export { CmsEntryFieldFilterPlugin } from "./CmsEntryFieldFilterPlugin.js";
export type { CmsEntryFieldFilterPluginCreateResponse } from "./CmsEntryFieldFilterPlugin.js";
export { CmsFieldFilterValueTransformPlugin } from "./CmsFieldFilterValueTransformPlugin.js";
export type {
    CmsFieldFilterValueTransformPlugin as CmsFieldFilterValueTransformPluginInterface,
    CmsFieldFilterValueTransformParams
} from "./CmsFieldFilterValueTransformPlugin.js";
```

- [ ] **Step 7: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(db-utils): move plugin base classes from api-headless-cms-ddb"
```

---

### Task 4: Move pure filtering utilities to db-utils

**Files:**
- Copy from: `packages/api-headless-cms-ddb/src/operations/entry/filtering/`
- Create: `packages/db-utils/src/filtering/`

These files have zero DDB dependencies: `getValue.ts`, `transform.ts`, `where.ts`, `values.ts`, `mapPlugins.ts`.

- [ ] **Step 1: Copy pure utility files**

Copy to `packages/db-utils/src/filtering/`:
- `getValue.ts` — no imports at all, copy as-is
- `transform.ts` — imports only `./types.js`, update to `./fields/types.js`
- `where.ts` — no imports (pure string parsing), copy as-is. Note: actual file may import `@webiny/api-headless-cms/types` and `@webiny/error` — keep those.
- `values.ts` — imports `CmsEntryListWhere` from `@webiny/api-headless-cms/types` and `@webiny/error` — keep those
- `mapPlugins.ts` — imports from `@webiny/plugins/types.js` and `@webiny/error` — keep those

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(db-utils): move pure filtering utilities"
```

---

### Task 5: Move field creation + system fields + sort extraction to db-utils

**Files:**
- Copy: `systemFields.ts` → `packages/db-utils/src/filtering/fields/systemFields.ts`
- Copy: `createFields.ts` → `packages/db-utils/src/filtering/fields/createFields.ts`
- Copy: `extractSort.ts` → `packages/db-utils/src/filtering/fields/extractSort.ts`

- [ ] **Step 1: Copy `systemFields.ts`**

Imports to update:
- `@webiny/api-headless-cms/types/index.js` — keep
- `@webiny/api-headless-cms/constants.js` — keep
- `@webiny/api-headless-cms` (`createModelField`) — keep
- `lodash/startCase.js` — keep

No DDB imports. Copy as-is.

- [ ] **Step 2: Copy `createFields.ts`**

Imports to update:
- `~/plugins/index.js` → `../../plugins/index.js` (CmsEntryFieldFilterPathPlugin)
- `~/types.js` → `../../plugins/CmsFieldFilterValueTransformPlugin.js` (the interface)
- `./systemFields.js` → `./systemFields.js` (same relative)
- `./types.js` → `./types.js` (same relative)
- `./mapPlugins.js` → `../mapPlugins.js` (one level up)
- Other imports (`@webiny/api-headless-cms/*`, `@webiny/plugins`) — keep

- [ ] **Step 3: Copy `extractSort.ts`**

Imports to update:
- `~/plugins/index.js` → `../../plugins/index.js` (CmsEntryFieldSortingPlugin)
- `./types.js` → `./types.js` (same relative)
- Other imports (`@webiny/error`, `@webiny/plugins`, `@webiny/api-headless-cms/types`) — keep

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(db-utils): move field creation, system fields, and sort extraction"
```

---

### Task 6: Move createExpressions to db-utils (with signature change)

**Files:**
- Copy: `createExpressions.ts` → `packages/db-utils/src/filtering/expressions/createExpressions.ts`

This is one of the files with DDB coupling. The signature must change to accept `valueFilterRegistry` as a parameter instead of resolving from `container`.

- [ ] **Step 1: Copy and update `createExpressions.ts`**

Imports to update:
- `~/plugins/CmsEntryFieldFilterPlugin.js` → `../../plugins/CmsEntryFieldFilterPlugin.js`
- `~/types.js` → `../../plugins/CmsFieldFilterValueTransformPlugin.js`
- `~/operations/entry/filtering/values.js` → `../values.js`
- `./mapPlugins.js` → `../mapPlugins.js`
- `./where.js` → `../where.js`
- `./transform.js` → `../transform.js`
- `./types.js` → `../fields/types.js`
- **Remove:** `@webiny/db-dynamodb/feature/ValueFilter/index.js` (ValueFilter)
- **Remove:** `@webiny/db-dynamodb/exports/api/db.js` (ValueFilterRegistry)
- **Add:** `import { ValueFilter } from "../../valueFilter/abstractions/ValueFilter.js"`
- **Add:** `import { ValueFilterRegistry } from "../../valueFilter/abstractions/ValueFilterRegistry.js"`

Signature change — add `valueFilterRegistry` to params:
```typescript
/* Old: container: CmsContext["container"] in ICreateExpressionsParams */
/* New: valueFilterRegistry: ValueFilterRegistry.Interface in ICreateExpressionsParams */
```

Remove `container.resolve(ValueFilterRegistry)` call — use `params.valueFilterRegistry` directly.

- [ ] **Step 2: Also copy `values.ts` to `expressions/` if not already done**

`values.ts` was placed in `filtering/` in Task 4. `createExpressions.ts` imports it as `../values.js` from within `expressions/`. Verify the relative path resolves correctly.

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(db-utils): move createExpressions with valueFilterRegistry param"
```

---

### Task 7: Move fullTextSearch to db-utils

**Files:**
- Copy: `fullTextSearch.ts` → `packages/db-utils/src/filtering/fullTextSearch.ts`

- [ ] **Step 1: Copy and update `fullTextSearch.ts`**

Imports to update:
- `./getValue.js` → `./getValue.js` (same level)
- `./types.js` → `./fields/types.js`
- **Remove:** `@webiny/db-dynamodb/exports/api/db.js` (ValueFilter)
- **Add:** `import { ValueFilter } from "../valueFilter/abstractions/ValueFilter.js"`

The `Params` interface has `filter: ValueFilter.Interface` — this already takes the filter as a param, no signature change needed.

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(db-utils): move fullTextSearch"
```

---

### Task 8: Move filter + sort to db-utils (with signature changes)

**Files:**
- Copy: `filter.ts` → `packages/db-utils/src/filtering/filter.ts`
- Copy: `sort.ts` → `packages/db-utils/src/filtering/sort.ts`

- [ ] **Step 1: Copy and update `filter.ts`**

Imports to update:
- `./types.js` → `./fields/types.js`
- `./fullTextSearch.js` → `./fullTextSearch.js`
- `./createExpressions.js` → `./expressions/createExpressions.js`
- `./transform.js` → `./transform.js`
- `~/operations/entry/filtering/getValue.js` → `./getValue.js`
- **Remove:** `@webiny/db-dynamodb/exports/api/db.js` (ValueFilterRegistry)
- **Add:** `import { ValueFilterRegistry } from "../valueFilter/abstractions/ValueFilterRegistry.js"`

Signature change — replace `container` with `valueFilterRegistry`:
```typescript
/* In IFilterParams: */
/* Old: container: CmsContext["container"] */
/* New: valueFilterRegistry: ValueFilterRegistry.Interface */
```

Update the body:
- Remove `const valueFilterRegistry = container.resolve(ValueFilterRegistry);`
- Use `params.valueFilterRegistry` directly
- Pass `valueFilterRegistry` to `createExpressions()` instead of `container`
- Resolve the "contains" filter for fullTextSearch: `valueFilterRegistry.get("contains")`

- [ ] **Step 2: Copy and update `sort.ts`**

Imports to update:
- `./extractSort.js` → `./fields/extractSort.js`
- `./types.js` → `./fields/types.js`
- Other imports (`@webiny/error`, `dot-prop`, `lodash/sortBy`, `@webiny/plugins`, `@webiny/api-headless-cms/types`) — keep

No signature changes needed — `sort()` doesn't use the container.

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(db-utils): move filter and sort with updated signatures"
```

---

### Task 9: Move filter create plugins to db-utils

**Files:**
- Copy: `filtering/plugins/` (all 5 files) → `packages/db-utils/src/filtering/plugins/`

- [ ] **Step 1: Copy all filter create plugin files**

Files: `defaultFilterCreate.ts`, `refFilterCreate.ts`, `objectFilterCreate.ts`, `searchableJsonFilterCreate.ts`, `index.ts`.

Import updates needed in each:
- `~/plugins/CmsEntryFieldFilterPlugin.js` → `../../plugins/CmsEntryFieldFilterPlugin.js`
- `~/operations/entry/filtering/where.js` → `../where.js`
- `~/operations/entry/filtering/transform.js` → `../transform.js`
- `~/types.js` → `../../plugins/CmsFieldFilterValueTransformPlugin.js`
- `@webiny/api-headless-cms/utils/getBaseFieldType.js` — keep
- `@webiny/api/types.js` — keep
- `@webiny/error` — keep

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(db-utils): move filter create plugins"
```

---

### Task 10: Move path plugins + rewrite datetime transform

**Files:**
- Copy: `dynamoDb/path/plainObject.ts` → `packages/db-utils/src/path/plainObject.ts`
- Copy: `dynamoDb/path/locationFolderId.ts` → `packages/db-utils/src/path/locationFolderId.ts`
- Create: `packages/db-utils/src/transforms/datetime.ts` (rewritten, no db-dynamodb deps)

- [ ] **Step 1: Copy path plugins**

Both import from `~/plugins/CmsEntryFieldFilterPathPlugin.js` — update to `../plugins/CmsEntryFieldFilterPathPlugin.js`.

- [ ] **Step 2: Rewrite datetime transform**

The original imports `TimeTransformPlugin` and `DateTimeTransformPlugin` from `@webiny/db-dynamodb`. Rewrite with inline logic:

```typescript
import { parseISO } from "date-fns";
import type { CmsFieldFilterValueTransformPlugin } from "../plugins/CmsFieldFilterValueTransformPlugin.js";

const transformDateTime = (value: string): number => {
    return parseISO(value).getTime();
};

const transformTime = (value: string): number => {
    const [hours, minutes, seconds = 0] = value.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

export const createDatetimeTransformValuePlugin = (): CmsFieldFilterValueTransformPlugin => {
    return {
        type: "cms-field-filter-value-transform",
        name: "cms-field-filter-value-transform-datetime",
        fieldType: "datetime",
        transform: ({ field, value }) => {
            if (!value) {
                return value;
            }
            const type = field.settings?.type;
            if (type === "time") {
                return transformTime(value);
            }
            return transformDateTime(value);
        }
    };
};
```

Verify the transform logic matches the original by reading `TimeTransformPlugin` and `DateTimeTransformPlugin` from `packages/db-dynamodb/src/plugins/definitions/`.

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(db-utils): move path plugins and rewrite datetime transform"
```

---

### Task 11: Create db-utils barrel exports + build

**Files:**
- Modify: `packages/db-utils/src/index.ts`

- [ ] **Step 1: Populate barrel exports**

Export everything consumers need:

```typescript
/* ValueFilter. */
export { ValueFilter } from "./valueFilter/abstractions/ValueFilter.js";
export { ValueFilterRegistry } from "./valueFilter/abstractions/ValueFilterRegistry.js";
export { ValueFilterFeature } from "./valueFilter/feature.js";

/* Filtering. */
export { filter } from "./filtering/filter.js";
export { sort } from "./filtering/sort.js";
export { createFields } from "./filtering/fields/createFields.js";
export { createFilterCreatePlugins } from "./filtering/plugins/index.js";

/* Plugin base classes. */
export { CmsEntryFieldFilterPlugin } from "./plugins/CmsEntryFieldFilterPlugin.js";
export type { CmsEntryFieldFilterPluginCreateResponse } from "./plugins/CmsEntryFieldFilterPlugin.js";
export { CmsEntryFieldSortingPlugin } from "./plugins/CmsEntryFieldSortingPlugin.js";
export { CmsEntryFieldFilterPathPlugin } from "./plugins/CmsEntryFieldFilterPathPlugin.js";
export type { CreatePathCallable } from "./plugins/CmsEntryFieldFilterPathPlugin.js";
export { CmsFieldFilterValueTransformPlugin } from "./plugins/CmsFieldFilterValueTransformPlugin.js";

/* Path + transform plugins. */
export { createPlainObjectPathPlugin } from "./path/plainObject.js";
export { createLocationFolderIdPathPlugin } from "./path/locationFolderId.js";
export { createDatetimeTransformValuePlugin } from "./transforms/datetime.js";

/* Types. */
export type { Field } from "./filtering/fields/types.js";
```

- [ ] **Step 2: Full build**

```bash
yarn build -p @webiny/db-utils 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(db-utils): add barrel exports"
```

---

### Task 12: Move tests to db-utils

**Files:**
- Copy from: `packages/db-dynamodb/__tests__/features/ValueFilter/*.test.ts` (11 files)
- Copy from: `packages/db-dynamodb/__tests__/features/FilterUtil/filterUtil.test.ts`
- Copy from: `packages/db-dynamodb/__tests__/features/FilterUtil/createFilterUtil.ts`
- Copy from: `packages/db-dynamodb/__tests__/__mocks/registry.ts`
- Copy from: `packages/api-headless-cms-ddb/__tests__/operations/entry/filtering/getValue.test.ts`
- Copy from: `packages/api-headless-cms-ddb/__tests__/plugins/dynamoDb/path/plainObject.test.ts`
- Copy from: `packages/api-headless-cms-ddb/__tests__/plugins/dynamoDb/transformValue/datetime.test.ts`
- Create: `packages/db-utils/__tests__/` directory structure

Tests that stay in the DDB package (CMS-bound, import from db-utils instead):
- `createFields.test.ts`, `createExpressions.test.ts`, `createFilters.test.ts`, `filter.test.ts`

- [ ] **Step 1: Copy ValueFilter tests (11 files)**

Copy `packages/db-dynamodb/__tests__/features/ValueFilter/` to `packages/db-utils/__tests__/valueFilter/`:
- `eq.test.ts`, `contains.test.ts`, `startsWith.test.ts`, `fuzzy.test.ts`
- `gt.test.ts`, `gte.test.ts`, `lt.test.ts`, `lte.test.ts`
- `in.test.ts`, `andIn.test.ts`, `between.test.ts`

These tests use a `createValueFilterRegistry()` helper that wires `ValueFilterFeature` into a DI container. Copy the mock helper from `packages/db-dynamodb/__tests__/__mocks/registry.ts` to `packages/db-utils/__tests__/__mocks/registry.ts`.

Update imports: replace `@webiny/db-dynamodb/feature/ValueFilter/index.js` with local `~/valueFilter/index.js` or `@webiny/db-utils` paths.

- [ ] **Step 2: Copy FilterUtil test**

Copy `packages/db-dynamodb/__tests__/features/FilterUtil/filterUtil.test.ts` and `createFilterUtil.ts` to `packages/db-utils/__tests__/filtering/filterUtil.test.ts`.

Update imports to reference `@webiny/db-utils` instead of `@webiny/db-dynamodb`.

- [ ] **Step 3: Copy getValue test**

Copy `packages/api-headless-cms-ddb/__tests__/operations/entry/filtering/getValue.test.ts` to `packages/db-utils/__tests__/filtering/getValue.test.ts`.

Update import: `~/operations/entry/filtering/getValue` → `~/filtering/getValue`.

Also copy any mock data files it depends on (check for entry mock imports).

- [ ] **Step 4: Copy plainObject path plugin test**

Copy `packages/api-headless-cms-ddb/__tests__/plugins/dynamoDb/path/plainObject.test.ts` to `packages/db-utils/__tests__/path/plainObject.test.ts`.

Update import: `~/dynamoDb/path/plainObject` → `~/path/plainObject`.

The test uses `CmsModelField` type from `@webiny/api-headless-cms/types` — this is a type-only import, which is fine since db-utils depends on `@webiny/api-headless-cms`.

- [ ] **Step 5: Copy datetime transform test**

Copy `packages/api-headless-cms-ddb/__tests__/plugins/dynamoDb/transformValue/datetime.test.ts` to `packages/db-utils/__tests__/transforms/datetime.test.ts`.

Update import: `~/dynamoDb/transformValue/datetime` → `~/transforms/datetime`.

Same `CmsModelField` type import — keep as-is.

- [ ] **Step 6: Set up test infrastructure**

Create `packages/db-utils/vitest.config.ts` (or equivalent) modeled after `packages/db-dynamodb`'s test config. Ensure `~/*` alias resolves to `./src/*` in tests.

Add test scripts to `packages/db-utils/package.json`:
```json
"scripts": {
    "test": "vitest run"
}
```

- [ ] **Step 7: Run db-utils tests**

```bash
yarn test packages/db-utils 2>&1 | tail -50
```

Expected: ~146 tests passing:
- 11 ValueFilter test files (~111 tests)
- FilterUtil tests (16 tests)
- getValue test (1 test)
- plainObject test (2 tests)
- datetime test (12 tests)

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "test(db-utils): move ValueFilter, filtering, path, and transform tests"
```

---

## Phase 2: Repoint DDB + db-dynamodb Imports

### Task 13: Update db-dynamodb to re-export ValueFilter from db-utils

**Files:**
- Modify: `packages/db-dynamodb/src/feature/ValueFilter/` — delete local copies, re-export from db-utils
- Modify: `packages/db-dynamodb/package.json` — add `@webiny/db-utils` dependency

- [ ] **Step 1: Add db-utils dependency to db-dynamodb**

In `packages/db-dynamodb/package.json`, add to `dependencies`:
```json
"@webiny/db-utils": "0.0.0"
```

- [ ] **Step 2: Replace local ValueFilter with re-exports**

Delete the local abstractions, implementations, feature, and filters from `packages/db-dynamodb/src/feature/ValueFilter/`. Replace the barrel `index.ts` with re-exports from db-utils:

```typescript
export { ValueFilter } from "@webiny/db-utils";
export { ValueFilterRegistry } from "@webiny/db-utils";
export { ValueFilterFeature } from "@webiny/db-utils";
```

Also update `packages/db-dynamodb/src/exports/api/db.ts` (or wherever ValueFilter and ValueFilterRegistry are re-exported to consumers) to re-export from db-utils.

- [ ] **Step 3: Update tsconfig references**

Add `@webiny/db-utils` to `packages/db-dynamodb/tsconfig.build.json` project references.

- [ ] **Step 4: Build db-dynamodb**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn build -p @webiny/db-dynamodb 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(db-dynamodb): re-export ValueFilter from db-utils"
```

---

### Task 14: Update api-headless-cms-ddb to import from db-utils

**Files:**
- Modify: `packages/api-headless-cms-ddb/package.json`
- Modify: `packages/api-headless-cms-ddb/src/index.ts`
- Modify: `packages/api-headless-cms-ddb/src/types.ts`
- Modify: `packages/api-headless-cms-ddb/src/operations/entry/index.ts`
- Delete: `packages/api-headless-cms-ddb/src/operations/entry/filtering/` (entire directory)
- Delete: `packages/api-headless-cms-ddb/src/plugins/` (4 base class files — keep index.ts if it re-exports)
- Delete: `packages/api-headless-cms-ddb/src/dynamoDb/path/`
- Delete: `packages/api-headless-cms-ddb/src/dynamoDb/transformValue/`
- Modify: `packages/api-headless-cms-ddb/src/dynamoDb/index.ts`

- [ ] **Step 1: Add db-utils dependency**

In `packages/api-headless-cms-ddb/package.json`, add:
```json
"@webiny/db-utils": "0.0.0"
```

- [ ] **Step 2: Delete moved files**

Delete:
- `src/operations/entry/filtering/` (entire directory)
- `src/plugins/CmsEntryFieldFilterPlugin.ts`
- `src/plugins/CmsEntryFieldSortingPlugin.ts`
- `src/plugins/CmsEntryFieldFilterPathPlugin.ts`
- `src/plugins/CmsFieldFilterValueTransformPlugin.ts`
- `src/dynamoDb/path/plainObject.ts`
- `src/dynamoDb/path/locationFolderId.ts`
- `src/dynamoDb/transformValue/datetime.ts`

- [ ] **Step 3: Update `src/plugins/index.ts` to re-export from db-utils**

```typescript
export {
    CmsEntryFieldFilterPathPlugin,
    CmsEntryFieldSortingPlugin,
    CmsEntryFieldFilterPlugin,
    CmsFieldFilterValueTransformPlugin
} from "@webiny/db-utils";
export type {
    CreatePathCallable,
    CmsEntryFieldFilterPluginCreateResponse
} from "@webiny/db-utils";
```

- [ ] **Step 4: Update `src/dynamoDb/index.ts`**

```typescript
import { createPlainObjectPathPlugin } from "@webiny/db-utils";
import { createLocationFolderIdPathPlugin } from "@webiny/db-utils";
import { createDatetimeTransformValuePlugin } from "@webiny/db-utils";

export default () => [
    createPlainObjectPathPlugin(),
    createLocationFolderIdPathPlugin(),
    createDatetimeTransformValuePlugin()
];
```

- [ ] **Step 5: Update `src/index.ts`**

Change `createFilterCreatePlugins` import from `~/operations/entry/filtering/plugins/index.js` to `@webiny/db-utils`.

- [ ] **Step 6: Update `src/operations/entry/index.ts`**

Change imports:
- `createFields` from `~/operations/entry/filtering/createFields.js` → `@webiny/db-utils`
- `filter, sort` from `~/operations/entry/filtering/index.js` → `@webiny/db-utils`

Update `filter()` call sites to pass `valueFilterRegistry` instead of `container`:
```typescript
/* Resolve once at the top of the operation. */
const valueFilterRegistry = context.container.resolve(ValueFilterRegistry);

/* Pass to filter(). */
filter({
    valueFilterRegistry,
    plugins,
    items,
    where,
    fields,
    search
})
```

Import `ValueFilterRegistry` from `@webiny/db-utils`.

- [ ] **Step 7: Update `src/types.ts`**

Remove the `CmsFieldFilterValueTransformPlugin` interface (it's now in db-utils). Re-export if any internal files still import from `~/types.js`:
```typescript
export type { CmsFieldFilterValueTransformPlugin } from "@webiny/db-utils";
```

- [ ] **Step 8: Update tsconfig references**

Add `@webiny/db-utils` to project references.

- [ ] **Step 9: Build**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn build -p @webiny/api-headless-cms-ddb 2>&1 | tail -30
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-ddb): import filtering from db-utils"
```

---

### Task 15: Update external consumers + build all

**Files:**
- Modify: `packages/webiny/src/api/db.ts` — re-export ValueFilter/ValueFilterRegistry from db-utils
- Modify: `packages/api-headless-cms-ddb/__tests__/operations/helpers/createTestContainer.ts` — update ValueFilterFeature import

- [ ] **Step 1: Update `packages/webiny/src/api/db.ts`**

Change ValueFilter/ValueFilterRegistry imports from `@webiny/db-dynamodb/feature/ValueFilter/index.js` to `@webiny/db-utils`.

- [ ] **Step 2: Update test helper**

Change `ValueFilterFeature` import in `createTestContainer.ts` from `@webiny/db-dynamodb/feature/ValueFilter/index.js` to `@webiny/db-utils`.

- [ ] **Step 3: Full build**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn build 2>&1 | tail -30
```

- [ ] **Step 4: Run DDB tests**

```bash
yarn test packages/api-headless-cms-ddb 2>&1 | tail -50
```

All existing DDB tests should pass — no logic changes.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor: update external consumers to use db-utils"
```

---

## Phase 3: Rewrite `@webiny/api-headless-cms-sql`

### Task 16: Simplify TableNameResolver

**Files:**
- Modify: `packages/api-headless-cms-sql/src/features/tableNameResolver/abstractions.ts`
- Modify: `packages/api-headless-cms-sql/src/features/tableNameResolver/TableNameResolver.ts`

The current resolver builds model-specific table names (`cms_{tenant}_{modelId}`). The new resolver returns fixed table names with optional prefix/suffix.

- [ ] **Step 1: Update `abstractions.ts`**

Add a new abstraction for the config that includes suffix:
```typescript
import { createAbstraction } from "@webiny/feature/api";

export interface ITableNameResolverConfig {
    sharedTables: boolean;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const TableNameResolverConfig = createAbstraction<ITableNameResolverConfig>(
    "Cms/Sql/TableNameResolverConfig"
);

export interface ITableNameResolver {
    resolve(entityName: string): string;
}

export const TableNameResolver = createAbstraction<ITableNameResolver>(
    "Cms/Sql/TableNameResolver"
);
```

Note: the `resolve` method no longer takes `tenant` — tenant is a column filter, not part of the table name.

- [ ] **Step 2: Rewrite `TableNameResolver.ts`**

```typescript
import { TableNameResolver } from "./abstractions.js";
import { TableNameResolverConfig } from "./abstractions.js";

class TableNameResolverImpl implements TableNameResolver.Interface {
    private readonly prefix: string;
    private readonly suffix: string;

    public constructor(private readonly config: TableNameResolverConfig.Interface) {
        this.prefix = config.tableNamePrefix ? `${config.tableNamePrefix}_` : "";
        this.suffix = config.tableNameSuffix ? `_${config.tableNameSuffix}` : "";
    }

    public resolve(entityName: string): string {
        return `${this.prefix}webiny_cms_${entityName}${this.suffix}`;
    }
}

export const TableNameResolverImplementation = TableNameResolver.createImplementation({
    implementation: TableNameResolverImpl,
    dependencies: [TableNameResolverConfig]
});
```

Table names produced: `webiny_cms_entries`, `webiny_cms_groups`, `webiny_cms_models` (with optional prefix/suffix).

- [ ] **Step 3: Update callers**

All callers currently call `tableNameResolver.resolve(tenant, modelId)`. Update to `tableNameResolver.resolve("entries")`, `tableNameResolver.resolve("groups")`, `tableNameResolver.resolve("models")`.

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): simplify TableNameResolver for fixed table names"
```

---

### Task 17: Create entry table schema manager

**Files:**
- Create: `packages/api-headless-cms-sql/src/features/entryTableManager/abstractions.ts`
- Create: `packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts`
- Create: `packages/api-headless-cms-sql/src/features/entryTableManager/feature.ts`
- Delete: `packages/api-headless-cms-sql/src/features/entrySchemaManager/` (entire directory)
- Delete: `packages/api-headless-cms-sql/src/features/schemaRegistry/` (entire directory)
- Delete: `packages/api-headless-cms-sql/src/features/fieldTypeMapper/` (entire directory)

- [ ] **Step 1: Create `abstractions.ts`**

```typescript
import { createAbstraction } from "@webiny/feature/api";

export interface IEntryTableManager {
    ensureTable(): Promise<void>;
    getTableName(): string;
}

export const EntryTableManager = createAbstraction<IEntryTableManager>(
    "Cms/Sql/EntryTableManager"
);
```

- [ ] **Step 2: Create `EntryTableManager.ts`**

```typescript
import type { Knex } from "knex";
import { EntryTableManager } from "./abstractions.js";
import { KnexInstance } from "../knexInstance/abstractions.js";
import { TableNameResolver } from "../tableNameResolver/abstractions.js";

class EntryTableManagerImpl implements EntryTableManager.Interface {
    private readonly tableName: string;
    private initialized = false;

    public constructor(
        private readonly knex: KnexInstance.Interface,
        private readonly tableNameResolver: TableNameResolver.Interface
    ) {
        this.tableName = this.tableNameResolver.resolve("entries");
    }

    public getTableName(): string {
        return this.tableName;
    }

    public async ensureTable(): Promise<void> {
        if (this.initialized) {
            return;
        }

        const exists = await this.knex.schema.hasTable(this.tableName);
        if (exists) {
            this.initialized = true;
            return;
        }

        await this.knex.schema.createTable(this.tableName, (table: Knex.CreateTableBuilder) => {
            table.text("id").primary();
            table.text("entryId").notNullable();
            table.text("modelId").notNullable();
            table.text("tenant").notNullable();
            table.integer("version").notNullable();
            table.text("status").notNullable();
            table.boolean("locked").notNullable().defaultTo(false);
            table.boolean("isLatest").notNullable().defaultTo(false);
            table.boolean("isPublished").notNullable().defaultTo(false);
            table.boolean("wbyDeleted").notNullable().defaultTo(false);
            table.text("binOriginalFolderId");

            /* Location. */
            table.text("location");
            table.text("location_folderId");

            /* Revision-level dates. */
            table.text("revisionCreatedOn");
            table.text("revisionModifiedOn");
            table.text("revisionSavedOn");
            table.text("revisionDeletedOn");
            table.text("revisionRestoredOn");
            table.text("revisionFirstPublishedOn");
            table.text("revisionLastPublishedOn");

            /* Revision-level identity (JSON blobs). */
            table.text("revisionCreatedBy");
            table.text("revisionModifiedBy");
            table.text("revisionSavedBy");
            table.text("revisionDeletedBy");
            table.text("revisionRestoredBy");
            table.text("revisionFirstPublishedBy");
            table.text("revisionLastPublishedBy");

            /* Entry-level dates. */
            table.text("createdOn");
            table.text("modifiedOn");
            table.text("savedOn");
            table.text("deletedOn");
            table.text("restoredOn");
            table.text("firstPublishedOn");
            table.text("lastPublishedOn");

            /* Entry-level identity (JSON blobs). */
            table.text("createdBy");
            table.text("modifiedBy");
            table.text("savedBy");
            table.text("deletedBy");
            table.text("restoredBy");
            table.text("firstPublishedBy");
            table.text("lastPublishedBy");

            /* Misc meta. */
            table.text("meta");
            table.text("system");
            table.text("live");
            table.text("revisionDescription");
            table.bigInteger("expiresAt");

            /* Content values (JSON blob). */
            table.text("values");

            /* Composite indexes. */
            table.index(["tenant", "modelId", "isLatest"]);
            table.index(["tenant", "modelId", "isPublished"]);
            table.index(["tenant", "modelId", "entryId"]);
        });

        this.initialized = true;
    }
}

export const EntryTableManagerImplementation = EntryTableManager.createImplementation({
    implementation: EntryTableManagerImpl,
    dependencies: [KnexInstance, TableNameResolver]
});
```

- [ ] **Step 3: Create `feature.ts`**

```typescript
import { createFeature } from "@webiny/feature/api";
import { EntryTableManagerImplementation } from "./EntryTableManager.js";

export const EntryTableManagerFeature = createFeature({
    name: "Cms/Sql/EntryTableManagerFeature",
    register: (container) => {
        container.register(EntryTableManagerImplementation);
    }
});
```

- [ ] **Step 4: Delete old features**

Delete:
- `packages/api-headless-cms-sql/src/features/entrySchemaManager/` (entire directory)
- `packages/api-headless-cms-sql/src/features/schemaRegistry/` (entire directory)
- `packages/api-headless-cms-sql/src/features/fieldTypeMapper/` (entire directory)

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): replace EntrySchemaManager with fixed EntryTableManager"
```

---

### Task 18: Rewrite entry types

**Files:**
- Rewrite: `packages/api-headless-cms-sql/src/operations/entry/types.ts`

- [ ] **Step 1: Rewrite `IEntryRow`**

Replace the entire file. The new `IEntryRow` matches the fixed table schema — no dynamic `[key: string]: unknown`:

```typescript
export interface IEntryRow {
    id: string;
    entryId: string;
    modelId: string;
    tenant: string;
    version: number;
    status: string;
    locked: boolean;
    isLatest: boolean;
    isPublished: boolean;
    wbyDeleted: boolean;
    binOriginalFolderId: string | null;

    location: string | null;
    location_folderId: string | null;

    revisionCreatedOn: string | null;
    revisionModifiedOn: string | null;
    revisionSavedOn: string | null;
    revisionDeletedOn: string | null;
    revisionRestoredOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;

    revisionCreatedBy: string | null;
    revisionModifiedBy: string | null;
    revisionSavedBy: string | null;
    revisionDeletedBy: string | null;
    revisionRestoredBy: string | null;
    revisionFirstPublishedBy: string | null;
    revisionLastPublishedBy: string | null;

    createdOn: string | null;
    modifiedOn: string | null;
    savedOn: string | null;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;

    createdBy: string | null;
    modifiedBy: string | null;
    savedBy: string | null;
    deletedBy: string | null;
    restoredBy: string | null;
    firstPublishedBy: string | null;
    lastPublishedBy: string | null;

    meta: string | null;
    system: string | null;
    live: string | null;
    revisionDescription: string | null;
    expiresAt: number | null;

    values: string;
}

/* Entry-level fields propagated to all revisions on write. */
/* No flattened _id/_displayName/_type — only JSON blob columns. */
export const ENTRY_LEVEL_META_FIELDS = [
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "modifiedBy",
    "savedBy",
    "deletedBy",
    "restoredBy",
    "firstPublishedBy",
    "lastPublishedBy"
] as const;
```

Note: the old `ENTRY_LEVEL_META_FIELDS` had 18 entries including `_id` variants. The new one has 12 entries — only the JSON blob columns.

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite IEntryRow for fixed schema"
```

---

### Task 19: Rewrite entry mappers

**Files:**
- Rewrite: `packages/api-headless-cms-sql/src/operations/entry/mappers.ts`

- [ ] **Step 1: Rewrite `entryToRow`**

```typescript
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IEntryRow } from "./types.js";

const stringify = (value: unknown): string | null => {
    if (value === null || value === undefined) {
        return null;
    }
    return JSON.stringify(value);
};

export const entryToRow = (
    entry: CmsStorageEntry,
    model: CmsModel,
    options: { isLatest: boolean; isPublished: boolean }
): IEntryRow => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: model.modelId,
        tenant: model.tenant,
        version: entry.version,
        status: entry.status,
        locked: entry.locked ?? false,
        isLatest: options.isLatest,
        isPublished: options.isPublished,
        wbyDeleted: entry.wbyDeleted ?? false,
        binOriginalFolderId: entry.binOriginalFolderId ?? null,

        location: stringify(entry.location),
        location_folderId: entry.location?.folderId ?? null,

        revisionCreatedOn: entry.revisionCreatedOn ?? null,
        revisionModifiedOn: entry.revisionModifiedOn ?? null,
        revisionSavedOn: entry.revisionSavedOn ?? null,
        revisionDeletedOn: entry.revisionDeletedOn ?? null,
        revisionRestoredOn: entry.revisionRestoredOn ?? null,
        revisionFirstPublishedOn: entry.revisionFirstPublishedOn ?? null,
        revisionLastPublishedOn: entry.revisionLastPublishedOn ?? null,

        revisionCreatedBy: stringify(entry.revisionCreatedBy),
        revisionModifiedBy: stringify(entry.revisionModifiedBy),
        revisionSavedBy: stringify(entry.revisionSavedBy),
        revisionDeletedBy: stringify(entry.revisionDeletedBy),
        revisionRestoredBy: stringify(entry.revisionRestoredBy),
        revisionFirstPublishedBy: stringify(entry.revisionFirstPublishedBy),
        revisionLastPublishedBy: stringify(entry.revisionLastPublishedBy),

        createdOn: entry.createdOn ?? null,
        modifiedOn: entry.modifiedOn ?? null,
        savedOn: entry.savedOn ?? null,
        deletedOn: entry.deletedOn ?? null,
        restoredOn: entry.restoredOn ?? null,
        firstPublishedOn: entry.firstPublishedOn ?? null,
        lastPublishedOn: entry.lastPublishedOn ?? null,

        createdBy: stringify(entry.createdBy),
        modifiedBy: stringify(entry.modifiedBy),
        savedBy: stringify(entry.savedBy),
        deletedBy: stringify(entry.deletedBy),
        restoredBy: stringify(entry.restoredBy),
        firstPublishedBy: stringify(entry.firstPublishedBy),
        lastPublishedBy: stringify(entry.lastPublishedBy),

        meta: stringify(entry.meta),
        system: stringify(entry.system),
        live: stringify(entry.live),
        revisionDescription: entry.revisionDescription ?? null,
        expiresAt: entry.expiresAt ?? null,

        values: JSON.stringify(entry.values)
    };
};
```

- [ ] **Step 2: Rewrite `rowToEntry`**

```typescript
const parse = <T = unknown>(value: string | null): T | null => {
    if (value === null || value === undefined) {
        return null;
    }
    return JSON.parse(value) as T;
};

const parseIdentity = (value: string | null) => {
    const parsed = parse(value);
    if (parsed) {
        return parsed;
    }
    return { id: "", displayName: "", type: "" };
};

export const rowToEntry = (row: IEntryRow): CmsStorageEntry => {
    return {
        id: row.id,
        entryId: row.entryId,
        modelId: row.modelId,
        tenant: row.tenant,
        version: row.version,
        status: row.status,
        locked: row.locked,
        wbyDeleted: row.wbyDeleted,
        binOriginalFolderId: row.binOriginalFolderId ?? undefined,

        location: parse(row.location) ?? undefined,

        revisionCreatedOn: row.revisionCreatedOn ?? "",
        revisionModifiedOn: row.revisionModifiedOn ?? undefined,
        revisionSavedOn: row.revisionSavedOn ?? "",
        revisionDeletedOn: row.revisionDeletedOn ?? undefined,
        revisionRestoredOn: row.revisionRestoredOn ?? undefined,
        revisionFirstPublishedOn: row.revisionFirstPublishedOn ?? undefined,
        revisionLastPublishedOn: row.revisionLastPublishedOn ?? undefined,

        revisionCreatedBy: parseIdentity(row.revisionCreatedBy),
        revisionModifiedBy: parse(row.revisionModifiedBy),
        revisionSavedBy: parseIdentity(row.revisionSavedBy),
        revisionDeletedBy: parse(row.revisionDeletedBy),
        revisionRestoredBy: parse(row.revisionRestoredBy),
        revisionFirstPublishedBy: parse(row.revisionFirstPublishedBy),
        revisionLastPublishedBy: parse(row.revisionLastPublishedBy),

        createdOn: row.createdOn ?? "",
        modifiedOn: row.modifiedOn ?? undefined,
        savedOn: row.savedOn ?? "",
        deletedOn: row.deletedOn ?? undefined,
        restoredOn: row.restoredOn ?? undefined,
        firstPublishedOn: row.firstPublishedOn ?? undefined,
        lastPublishedOn: row.lastPublishedOn ?? undefined,

        createdBy: parseIdentity(row.createdBy),
        modifiedBy: parse(row.modifiedBy),
        savedBy: parseIdentity(row.savedBy),
        deletedBy: parse(row.deletedBy),
        restoredBy: parse(row.restoredBy),
        firstPublishedBy: parse(row.firstPublishedBy),
        lastPublishedBy: parse(row.lastPublishedBy),

        meta: parse(row.meta) ?? undefined,
        system: parse(row.system) ?? undefined,
        live: parse(row.live) ?? null,
        revisionDescription: row.revisionDescription ?? undefined,
        expiresAt: row.expiresAt ?? null,

        values: JSON.parse(row.values)
    } as CmsStorageEntry;
};
```

- [ ] **Step 3: Add `getEntryLevelMeta` helper**

```typescript
import { ENTRY_LEVEL_META_FIELDS } from "./types.js";

export const getEntryLevelMeta = (row: IEntryRow): Partial<IEntryRow> => {
    const meta: Record<string, unknown> = {};
    for (const field of ENTRY_LEVEL_META_FIELDS) {
        meta[field] = row[field as keyof IEntryRow];
    }
    return meta as Partial<IEntryRow>;
};
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite entry mappers for JSON values"
```

---

### Task 20: Rewrite point-read operations

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

Rewrite operations 1–8 (the simple SELECT queries). These don't use filtering — they're direct lookups.

- [ ] **Step 1: Rewrite `getByIds`**

```typescript
const getByIds: CmsEntryStorageOperations["getByIds"] = async (model, { ids }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const rows = await knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("modelId", model.modelId)
        .whereIn("id", ids);
    return rows.map(rowToEntry);
};
```

- [ ] **Step 2: Rewrite `getPublishedByIds`**

Strip composite IDs to entryId, then filter `isPublished = true`:
```typescript
const getPublishedByIds: CmsEntryStorageOperations["getPublishedByIds"] = async (model, { ids }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const entryIds = ids.map((id) => id.split("#")[0]);
    const rows = await knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("modelId", model.modelId)
        .where("isPublished", true)
        .whereIn("entryId", entryIds);
    return rows.map(rowToEntry);
};
```

- [ ] **Step 3: Rewrite `getLatestByIds`**

Same as above with `isLatest = true`.

- [ ] **Step 4: Rewrite `getRevisions`**

```typescript
const getRevisions: CmsEntryStorageOperations["getRevisions"] = async (model, { id }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const entryId = id.split("#")[0];
    const rows = await knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("modelId", model.modelId)
        .where("entryId", entryId)
        .orderBy("version", "desc");
    return rows.map(rowToEntry);
};
```

- [ ] **Step 5: Rewrite `getRevisionById`, `getPublishedRevisionByEntryId`, `getLatestRevisionByEntryId`, `getPreviousRevision`**

All are single-row lookups with `.first()`. Follow the same pattern as current but with simplified table access via `entryTableManager`.

- [ ] **Step 6: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite point-read entry operations"
```

---

### Task 21: Rewrite list + get operations (with in-memory filtering)

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`
- Delete: `packages/api-headless-cms-sql/src/operations/entry/whereBuilder.ts`

This is the key change — list loads all matching rows and filters in memory.

- [ ] **Step 1: Add db-utils dependency to SQL package**

In `packages/api-headless-cms-sql/package.json`:
```json
"@webiny/db-utils": "0.0.0"
```

- [ ] **Step 2: Rewrite `list`**

```typescript
import { filter } from "@webiny/db-utils";
import { sort } from "@webiny/db-utils";
import { createFields } from "@webiny/db-utils";
import { ValueFilterRegistry } from "@webiny/db-utils";

const list: CmsEntryStorageOperations["list"] = async (model, params) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Build base query. */
    let query = knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("modelId", model.modelId);

    /* Determine list mode. */
    const where = params.where || {};
    if (where.entryId) {
        query = query.where("entryId", where.entryId);
    } else if (where.published === true || where.isPublished === true) {
        query = query.where("isPublished", true);
    } else {
        query = query.where("isLatest", true);
    }

    if (where.wbyDeleted !== undefined) {
        query = query.where("wbyDeleted", where.wbyDeleted);
    } else {
        query = query.where("wbyDeleted", false);
    }

    /* Load all matching rows. */
    const rows = await query;
    let items = rows.map(rowToEntry);

    /* Apply CMS fromStorage transforms. */
    items = await Promise.all(
        items.map((item) => convertFromStorage(item, model))
    );

    /* Build field map for filtering. */
    const fields = createFields({ model, plugins });

    /* Resolve valueFilterRegistry. */
    const valueFilterRegistry = container.resolve(ValueFilterRegistry);

    /* In-memory filter. */
    let filtered = filter({
        valueFilterRegistry,
        plugins,
        items,
        where,
        fields,
        search: params.search
    });

    const totalCount = filtered.length;

    /* In-memory sort. */
    filtered = sort({
        plugins,
        items: filtered,
        sort: params.sort,
        fields,
        model
    });

    /* Offset-based pagination. */
    const limit = params.limit ?? 50;
    const start = params.after ? Number(Buffer.from(params.after, "base64").toString()) : 0;
    const page = filtered.slice(start, start + limit);
    const hasMoreItems = start + limit < totalCount;
    const cursor = hasMoreItems
        ? Buffer.from(String(start + limit)).toString("base64")
        : null;

    return {
        items: page,
        totalCount,
        hasMoreItems,
        cursor
    };
};
```

- [ ] **Step 3: Rewrite `get`**

`get` is list with limit=1:
```typescript
const get: CmsEntryStorageOperations["get"] = async (model, params) => {
    const result = await list(model, { ...params, limit: 1 });
    return result.items[0] ?? null;
};
```

- [ ] **Step 4: Delete `whereBuilder.ts`**

```bash
rm packages/api-headless-cms-sql/src/operations/entry/whereBuilder.ts
```

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite list+get with in-memory filtering"
```

---

### Task 22: Rewrite create + createRevisionFrom

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `create`**

```typescript
const create: CmsEntryStorageOperations["create"] = async (model, { entry, storageEntry }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const isPublished = storageEntry.status === "published";
    const row = entryToRow(storageEntry, model, { isLatest: true, isPublished });
    await knex(tableName).insert(row);
    return entry;
};
```

- [ ] **Step 2: Rewrite `createRevisionFrom`**

```typescript
const createRevisionFrom: CmsEntryStorageOperations["createRevisionFrom"] = async (
    model,
    { entry, storageEntry }
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Demote current latest. */
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .where("isLatest", true)
        .update({ isLatest: false });

    /* Insert new revision as latest. */
    const row = entryToRow(storageEntry, model, { isLatest: true, isPublished: false });
    await knex(tableName).insert(row);

    return entry;
};
```

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite create + createRevisionFrom"
```

---

### Task 23: Rewrite update

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `update`**

```typescript
const update: CmsEntryStorageOperations["update"] = async (model, { entry, storageEntry }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Read existing row to preserve isLatest/isPublished flags. */
    const existing = await knex<IEntryRow>(tableName)
        .where("id", storageEntry.id)
        .first();

    const row = entryToRow(storageEntry, model, {
        isLatest: existing?.isLatest ?? false,
        isPublished: existing?.isPublished ?? false
    });

    await knex(tableName).where("id", storageEntry.id).update(row);

    /* Propagate entry-level meta to all revisions. */
    const entryLevelMeta = getEntryLevelMeta(row);
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update(entryLevelMeta);

    return entry;
};
```

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite update operation"
```

---

### Task 24: Rewrite publish + unpublish

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `publish`**

```typescript
const publish: CmsEntryStorageOperations["publish"] = async (model, { entry, storageEntry }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Unpublish current published revision. */
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .where("isPublished", true)
        .update({ isPublished: false, status: "unpublished" });

    /* Read existing row for isLatest flag. */
    const existing = await knex<IEntryRow>(tableName)
        .where("id", storageEntry.id)
        .first();

    const row = entryToRow(storageEntry, model, {
        isLatest: existing?.isLatest ?? false,
        isPublished: true
    });

    await knex(tableName).where("id", storageEntry.id).update(row);

    /* Propagate entry-level meta + live to all revisions. */
    const entryLevelMeta = getEntryLevelMeta(row);
    const liveValue = JSON.stringify({ version: entry.version });
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update({ ...entryLevelMeta, live: liveValue });

    return entry;
};
```

- [ ] **Step 2: Rewrite `unpublish`**

```typescript
const unpublish: CmsEntryStorageOperations["unpublish"] = async (model, { entry, storageEntry }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Read existing row for isLatest flag. */
    const existing = await knex<IEntryRow>(tableName)
        .where("id", storageEntry.id)
        .first();

    const row = entryToRow(storageEntry, model, {
        isLatest: existing?.isLatest ?? false,
        isPublished: false
    });

    await knex(tableName).where("id", storageEntry.id).update(row);

    /* Propagate entry-level meta + clear live on all revisions. */
    const entryLevelMeta = getEntryLevelMeta(row);
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update({ ...entryLevelMeta, live: null });

    return entry;
};
```

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite publish + unpublish"
```

---

### Task 25: Rewrite delete operations

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `deleteRevision`**

```typescript
const deleteRevision: CmsEntryStorageOperations["deleteRevision"] = async (
    model,
    { storageEntry, latestStorageEntry }
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Read existing row to check if it was published. */
    const existing = await knex<IEntryRow>(tableName)
        .where("id", storageEntry.id)
        .first();
    const wasPublished = existing?.isPublished ?? false;

    /* Delete the revision row. */
    await knex(tableName).where("id", storageEntry.id).delete();

    /* If was published, clear live on all remaining revisions. */
    if (wasPublished) {
        await knex(tableName)
            .where("tenant", model.tenant)
            .where("entryId", storageEntry.entryId)
            .update({ live: null });
    }

    /* If a new latest entry is provided, update it. */
    if (latestStorageEntry) {
        const latestRow = entryToRow(latestStorageEntry, model, {
            isLatest: true,
            isPublished: latestStorageEntry.status === "published"
        });
        if (wasPublished) {
            latestRow.live = null;
        }
        await knex(tableName)
            .where("id", latestStorageEntry.id)
            .update(latestRow);
    }
};
```

- [ ] **Step 2: Rewrite `delete` (full entry)**

```typescript
const deleteEntry: CmsEntryStorageOperations["delete"] = async (model, { entry }) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const entryId = entry.id.split("#")[0];
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entryId)
        .delete();
};
```

- [ ] **Step 3: Rewrite `deleteMultipleEntries`**

```typescript
const deleteMultipleEntries: CmsEntryStorageOperations["deleteMultipleEntries"] = async (
    model,
    { entries }
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    await knex(tableName)
        .where("tenant", model.tenant)
        .whereIn("entryId", entries)
        .delete();
};
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite delete operations"
```

---

### Task 26: Rewrite move + bin operations

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `move`**

```typescript
const move: CmsEntryStorageOperations["move"] = async (model, id, folderId) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();
    const entryId = id.split("#")[0];
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entryId)
        .update({
            location: JSON.stringify({ folderId }),
            location_folderId: folderId
        });
};
```

- [ ] **Step 2: Rewrite `moveToBin`**

```typescript
const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (
    model,
    { entry, storageEntry }
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    const row = entryToRow(storageEntry, model, { isLatest: false, isPublished: false });
    const entryLevelMeta = getEntryLevelMeta(row);

    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update({
            wbyDeleted: true,
            isPublished: false,
            binOriginalFolderId: storageEntry.binOriginalFolderId ?? null,
            location: row.location,
            location_folderId: row.location_folderId,
            live: null,
            ...entryLevelMeta
        });

    return entry;
};
```

- [ ] **Step 3: Rewrite `restoreFromBin`**

```typescript
const restoreFromBin: CmsEntryStorageOperations["restoreFromBin"] = async (
    model,
    { entry, storageEntry }
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    const row = entryToRow(storageEntry, model, { isLatest: false, isPublished: false });
    const entryLevelMeta = getEntryLevelMeta(row);

    /* Restore all revisions. */
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update({
            wbyDeleted: false,
            binOriginalFolderId: null,
            location: row.location,
            location_folderId: row.location_folderId,
            ...entryLevelMeta
        });

    /* Clear isLatest on all revisions. */
    await knex(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .update({ isLatest: false });

    /* Find the highest version and set it as latest. */
    const highestVersion = await knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("entryId", entry.entryId)
        .orderBy("version", "desc")
        .first();

    if (highestVersion) {
        await knex(tableName)
            .where("id", highestVersion.id)
            .update({ isLatest: true });
    }

    return entry;
};
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite move + bin operations"
```

---

### Task 27: Rewrite getUniqueFieldValues

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `getUniqueFieldValues`**

Load matching entries, parse values, extract the target field, aggregate in memory:

```typescript
const getUniqueFieldValues: CmsEntryStorageOperations["getUniqueFieldValues"] = async (
    model,
    params
) => {
    await entryTableManager.ensureTable();
    const tableName = entryTableManager.getTableName();

    /* Load latest entries. */
    let query = knex<IEntryRow>(tableName)
        .where("tenant", model.tenant)
        .where("modelId", model.modelId)
        .where("isLatest", true)
        .where("wbyDeleted", false);

    const rows = await query;
    const items = rows.map(rowToEntry);

    /* Extract field values and count occurrences. */
    const counts = new Map<string, number>();
    for (const item of items) {
        const value = item.values[params.fieldId];
        if (value === null || value === undefined) {
            continue;
        }
        const key = String(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    /* Sort by count desc, then value asc. */
    const result = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    return result;
};
```

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): rewrite getUniqueFieldValues in-memory"
```

---

### Task 28: Delete removed features + update DI wiring

**Files:**
- Delete: `packages/api-headless-cms-sql/src/features/sqlOperator/` (entire directory)
- Delete: `packages/api-headless-cms-sql/src/features/sqlEntryFilter/` (entire directory)
- Delete: `packages/api-headless-cms-sql/src/utils/columnName.ts`
- Delete: `packages/api-headless-cms-sql/src/utils/parseWhereKey.ts`
- Delete: `packages/api-headless-cms-sql/src/utils/parseSortField.ts`
- Delete: `packages/api-headless-cms-sql/src/utils/cursor.ts`
- Modify: `packages/api-headless-cms-sql/src/index.ts` (update DI registration)

- [ ] **Step 1: Delete removed files**

```bash
rm -rf packages/api-headless-cms-sql/src/features/sqlOperator
rm -rf packages/api-headless-cms-sql/src/features/sqlEntryFilter
rm -rf packages/api-headless-cms-sql/src/features/entrySchemaManager  # if not already deleted
rm -rf packages/api-headless-cms-sql/src/features/schemaRegistry       # if not already deleted
rm -rf packages/api-headless-cms-sql/src/features/fieldTypeMapper      # if not already deleted
rm packages/api-headless-cms-sql/src/utils/columnName.ts
rm packages/api-headless-cms-sql/src/utils/parseWhereKey.ts
rm packages/api-headless-cms-sql/src/utils/parseSortField.ts
rm packages/api-headless-cms-sql/src/utils/cursor.ts
```

- [ ] **Step 2: Update `src/index.ts` — DI wiring**

Remove registrations for deleted features. Add `ValueFilterFeature` and `EntryTableManagerFeature`:

```typescript
import { ValueFilterFeature } from "@webiny/db-utils";
import { EntryTableManagerFeature } from "./features/entryTableManager/feature.js";
/* Keep: KnexInstanceFeature, TableNameResolverFeature, GroupSchemaManagerFeature, ModelSchemaManagerFeature. */

/* In the register block: */
container.register(KnexInstanceFeature);
container.register(TableNameResolverFeature);
container.register(ValueFilterFeature);
container.register(GroupSchemaManagerFeature);
container.register(ModelSchemaManagerFeature);
container.register(EntryTableManagerFeature);
/* Remove: SchemaRegistryFeature, FieldTypeMapperFeature, EntrySchemaManagerFeature, SqlOperatorFeature, SqlEntryFilterFeature. */
```

- [ ] **Step 3: Update `createSqlStorageOperations` factory**

Remove injections of deleted features (`entrySchemaManager`, `sqlOperatorRegistry`, `sqlEntryFilterRegistry`, `fieldTypeMapper`, `schemaRegistry`). Add `entryTableManager` injection.

The entry storage operations factory should receive: `knex`, `tableNameResolver`, `entryTableManager`, `container` (for resolving ValueFilterRegistry), `plugins`.

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): delete removed features and update DI wiring"
```

---

### Task 29: Update SQL package deps + test setup

**Files:**
- Modify: `packages/api-headless-cms-sql/package.json`
- Modify: `packages/api-headless-cms-sql/__tests__/__api__/setupAfterEnv.js`

- [ ] **Step 1: Update `package.json`**

Add `@webiny/db-utils` to dependencies. Remove any deps that are no longer needed (check if `knex` is still needed — yes, it is).

- [ ] **Step 2: Update `setupAfterEnv.js`**

The `beforeEach` hook currently drops all tables and bumps `__schemaRegistryVersion`. Since `SchemaRegistry` is gone, simplify to:

```javascript
beforeEach(async () => {
    const knex = global.__testKnex;
    /* Drop all tables. */
    const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    for (const { name } of tables) {
        await knex.schema.dropTableIfExists(name);
    }
});
```

The `EntryTableManager` uses an `initialized` flag. Since tables are dropped between tests, we need a way to reset it. Options:
- Bump a global version counter (like SchemaRegistry did).
- Or recreate the storage operations between tests.

Check how the test setup creates the storage operations and choose the appropriate reset mechanism.

- [ ] **Step 3: Update tsconfig references**

Add `@webiny/db-utils` to `tsconfig.build.json` project references.

- [ ] **Step 4: Run full pre-commit checklist**

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

- [ ] **Step 5: Build all affected packages**

```bash
yarn build 2>&1 | tail -30
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(api-headless-cms-sql): update package deps and test setup"
```

---

### Task 30: Run tests and fix failures

**Files:** Various — depends on test results

- [ ] **Step 1: Run SQL tests**

```bash
yarn test packages/api-headless-cms --testPathPattern="sql" 2>&1 | tail -100
```

Or if tests use the standard CMS test suite:
```bash
WEBINY_STORAGE=sql,ddb yarn test packages/api-headless-cms 2>&1 | tail -100
```

- [ ] **Step 2: Analyze failures**

Common expected failure categories:
- Import path errors — files still referencing deleted paths
- `convertFromStorage` — verify the CMS storage transform pipeline still works with JSON values
- `wbyDeleted` filter — verify the default `false` is applied
- Cursor format — old tests may expect keyset cursors, new format is offset-based
- `getUniqueFieldValues` — field path may need to use `storageId` instead of `fieldId`

- [ ] **Step 3: Fix failures iteratively**

For each failure: identify root cause, fix, build, re-run the failing test, commit.

- [ ] **Step 4: Run DDB tests to verify no regressions**

```bash
yarn test packages/api-headless-cms 2>&1 | tail -100
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "fix(api-headless-cms-sql): fix test failures after storage rewrite"
```

---

## Task Summary

| # | Task | Phase |
|---|---|---|
| 1 | Package skeleton for db-utils | 1 |
| 2 | Move ValueFilter to db-utils | 1 |
| 3 | Move plugin base classes to db-utils | 1 |
| 4 | Move pure filtering utilities to db-utils | 1 |
| 5 | Move field creation + system fields + sort extraction | 1 |
| 6 | Move createExpressions (signature change) | 1 |
| 7 | Move fullTextSearch | 1 |
| 8 | Move filter + sort (signature changes) | 1 |
| 9 | Move filter create plugins | 1 |
| 10 | Move path plugins + rewrite datetime transform | 1 |
| 11 | Create db-utils barrel exports + build | 1 |
| 12 | Move tests to db-utils (~146 tests) | 1 |
| 13 | Update db-dynamodb to re-export from db-utils | 2 |
| 14 | Update api-headless-cms-ddb to import from db-utils | 2 |
| 15 | Update external consumers + build all | 2 |
| 16 | Simplify TableNameResolver | 3 |
| 17 | Create entry table schema manager | 3 |
| 18 | Rewrite entry types | 3 |
| 19 | Rewrite entry mappers | 3 |
| 20 | Rewrite point-read operations | 3 |
| 21 | Rewrite list + get with in-memory filtering | 3 |
| 22 | Rewrite create + createRevisionFrom | 3 |
| 23 | Rewrite update | 3 |
| 24 | Rewrite publish + unpublish | 3 |
| 25 | Rewrite delete operations | 3 |
| 26 | Rewrite move + bin operations | 3 |
| 27 | Rewrite getUniqueFieldValues | 3 |
| 28 | Delete removed features + update DI wiring | 3 |
| 29 | Update SQL package deps + test setup | 3 |
| 30 | Run tests and fix failures | 3 |
