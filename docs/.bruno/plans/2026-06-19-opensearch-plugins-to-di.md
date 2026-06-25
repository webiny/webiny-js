# OpenSearch Plugin Definitions → DI Abstractions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 5 plugin classes in `packages/api-opensearch/src/plugins/definition/` to proper DI abstractions, removing `Plugin` base class inheritance.

**Architecture:** Three of the five plugins (BodyModifier, QueryModifier, SortModifier) are dead code — already replaced by CMS-side DI abstractions — and will be deleted. The remaining two (FieldPlugin, IndexPlugin) will be converted to DI abstractions following the established `createAbstraction` + `createImplementation` pattern used by `OpenSearchQueryBuilderOperator`.

**Tech Stack:** `@webiny/feature` (`createAbstraction`, `createImplementation`, `createFeature`), `@webiny/di` container

## Global Constraints

- ES modules only (no CommonJS/require).
- One class per file.
- One named import per line.
- Use `createAbstraction` from `@webiny/feature/exports/api.js`.
- No `export default` — always named exports.
- Class uses `Impl` suffix, export const matches abstraction name.
- Comments end with period; `//` single-line, `/* */` multi-line.
- No backwards-compat shims.

## File Map

### Deleted

- `packages/api-opensearch/src/plugins/definition/OpenSearchBodyModifierPlugin.ts`
- `packages/api-opensearch/src/plugins/definition/OpenSearchQueryModifierPlugin.ts`
- `packages/api-opensearch/src/plugins/definition/OpenSearchSortModifierPlugin.ts`

### Created

- `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchField.ts` — interface + abstraction token
- `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchFieldFactory.ts` — factory interface + abstraction token
- `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldImpl.ts` — implementation class
- `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldFactoryImpl.ts` — factory implementation
- `packages/api-opensearch/src/features/OpenSearchField/feature.ts` — DI feature registration
- `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndex.ts` — interface + abstraction token
- `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.ts` — registry interface + abstraction token
- `packages/api-opensearch/src/features/OpenSearchIndex/OpenSearchIndexRegistryImpl.ts` — registry implementation
- `packages/api-opensearch/src/features/OpenSearchIndex/feature.ts` — DI feature registration

### Modified

- `packages/api-opensearch/src/plugins/definition/index.ts` — remove 3 deleted exports
- `packages/api-opensearch/src/sort.ts` — use `OpenSearchField.Interface` type
- `packages/api-opensearch/src/where.ts` — use `OpenSearchField.Interface` type
- `packages/api-opensearch/src/indices.ts` — use `OpenSearchIndexRegistry` instead of `PluginsContainer`
- `packages/api-opensearch/src/utils/createIndex.ts` — use `OpenSearchIndex.Interface` instead of plugin + `PluginsContainer`
- `packages/api-opensearch/src/index.ts` — remove `indices.ts` re-export (internal only now)
- `packages/api-opensearch/src/exports/api/opensearch.ts` — add new abstraction exports
- `packages/api-opensearch/src/registerOpenSearchCore.ts` — register new features
- `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/sort.ts` — use `OpenSearchFieldFactory` instead of `new OpenSearchFieldPlugin()`

---

### Task 1: Delete dead modifier plugins

**Files:**
- Delete: `packages/api-opensearch/src/plugins/definition/OpenSearchBodyModifierPlugin.ts`
- Delete: `packages/api-opensearch/src/plugins/definition/OpenSearchQueryModifierPlugin.ts`
- Delete: `packages/api-opensearch/src/plugins/definition/OpenSearchSortModifierPlugin.ts`
- Modify: `packages/api-opensearch/src/plugins/definition/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: clean barrel export with only `OpenSearchFieldPlugin` and `OpenSearchIndexPlugin`

- [ ] **Step 1: Delete the 3 modifier plugin files**

```bash
rm packages/api-opensearch/src/plugins/definition/OpenSearchBodyModifierPlugin.ts
rm packages/api-opensearch/src/plugins/definition/OpenSearchQueryModifierPlugin.ts
rm packages/api-opensearch/src/plugins/definition/OpenSearchSortModifierPlugin.ts
```

- [ ] **Step 2: Update the barrel export**

Update `packages/api-opensearch/src/plugins/definition/index.ts` to:

```ts
export * from "./OpenSearchFieldPlugin.js";
export * from "./OpenSearchIndexPlugin.js";
```

- [ ] **Step 3: Verify no broken imports**

```bash
yarn build -p @webiny/api-opensearch 2>&1 | tail -30
```

Expected: clean build with no import errors. If any external consumer breaks, that consumer was importing a dead type — fix the import.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "refactor: delete dead modifier plugin base classes

OpenSearchBodyModifierPlugin, OpenSearchQueryModifierPlugin, and
OpenSearchSortModifierPlugin are unused — replaced by CMS-side DI
abstractions (CmsEntryOpenSearchBodyModifier, etc.)."
```

---

### Task 2: Create OpenSearchField DI abstraction + factory

**Files:**
- Create: `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchField.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchFieldFactory.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldImpl.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldFactoryImpl.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchField/feature.ts`

**Interfaces:**
- Consumes: types from `~/types.js` (`FieldSortOptions`, `SortOrder`)
- Produces:
  - `OpenSearchField.Interface` — `field`, `path`, `keyword`, `unmappedType`, `sortable`, `searchable`, `getPath(field: string): string`, `getBasePath(field: string): string`, `getSortOptions(order: SortOrder): FieldSortOptions`, `toSearchValue(params: ToSearchValueParams): any`
  - `OpenSearchField.ALL: string` — the `"*"` constant
  - `OpenSearchField.Params` — constructor params type
  - `OpenSearchFieldFactory.Interface` — `create(params: OpenSearchField.Params): OpenSearchField.Interface`
  - `OpenSearchFieldFeature` — DI feature that registers the factory

- [ ] **Step 1: Create the OpenSearchField abstraction**

Create `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchField.ts`:

```ts
import { createAbstraction } from "@webiny/feature/exports/api.js";
import type {
    FieldSortOptions,
    SortOrder
} from "~/types.js";

export interface ToSearchValueParams {
    value: any;
    path: string;
    basePath: string;
}

export interface OpenSearchFieldParams {
    field: string;
    path?: string;
    keyword?: boolean;
    unmappedType?: string;
    sortable?: boolean;
    searchable?: boolean;
    toSearchValue?: (params: ToSearchValueParams) => any;
}

export interface IOpenSearchField {
    readonly field: string;
    readonly path: string;
    readonly keyword: boolean;
    readonly unmappedType?: string;
    readonly sortable: boolean;
    readonly searchable: boolean;
    getPath(field: string): string;
    getBasePath(field: string): string;
    getSortOptions(order: SortOrder): FieldSortOptions;
    toSearchValue(params: ToSearchValueParams): any;
}

export const OpenSearchField = createAbstraction<IOpenSearchField>("OpenSearch/Field");

export namespace OpenSearchField {
    export type Interface = IOpenSearchField;
    export type Params = OpenSearchFieldParams;
    export type SearchValueParams = ToSearchValueParams;
    export const ALL = "*";
}
```

- [ ] **Step 2: Create the OpenSearchFieldFactory abstraction**

Create `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchFieldFactory.ts`:

```ts
import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchField } from "./OpenSearchField.js";

export interface IOpenSearchFieldFactory {
    create(params: OpenSearchField.Params): OpenSearchField.Interface;
}

export const OpenSearchFieldFactory = createAbstraction<IOpenSearchFieldFactory>(
    "OpenSearch/FieldFactory"
);

export namespace OpenSearchFieldFactory {
    export type Interface = IOpenSearchFieldFactory;
}
```

- [ ] **Step 3: Create the OpenSearchField implementation**

Create `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldImpl.ts`:

```ts
import type {
    FieldSortOptions,
    SortOrder
} from "~/types.js";
import type { OpenSearchField } from "./abstractions/OpenSearchField.js";

const keywordLessUnmappedType = ["date", "long"];

const unmappedTypeHasKeyword = (type?: string): boolean => {
    if (!type) {
        return true;
    } else if (keywordLessUnmappedType.includes(type)) {
        return false;
    }
    return true;
};

export class OpenSearchFieldImpl implements OpenSearchField.Interface {
    public readonly field: string;
    public readonly path: string;
    public readonly keyword: boolean;
    public readonly unmappedType?: string;
    public readonly sortable: boolean;
    public readonly searchable: boolean;
    private readonly searchValueFn?: (params: OpenSearchField.SearchValueParams) => any;

    public constructor(params: OpenSearchField.Params) {
        this.field = params.field;
        this.path = params.path || params.field;
        this.keyword = params.keyword === undefined ? true : params.keyword;
        this.unmappedType = params.unmappedType;
        if (unmappedTypeHasKeyword(params.unmappedType) === false) {
            this.keyword = false;
        }
        this.sortable = params.sortable === undefined ? true : params.sortable;
        this.searchable = params.searchable === undefined ? true : params.searchable;
        this.searchValueFn = params.toSearchValue;
    }

    public getSortOptions(order: SortOrder): FieldSortOptions {
        const options = {
            order
        };
        if (!this.unmappedType) {
            return options;
        }
        return {
            ...options,
            unmapped_type: this.unmappedType as any
        };
    }

    public getPath(field: string): string {
        return `${this.getBasePath(field)}${this.keyword ? ".keyword" : ""}`;
    }

    public getBasePath(field: string): string {
        if (this.path === "*") {
            return field;
        }
        return this.path;
    }

    public toSearchValue(params: OpenSearchField.SearchValueParams): any {
        if (this.searchValueFn) {
            return this.searchValueFn(params);
        }
        return params.value;
    }
}
```

- [ ] **Step 4: Create the OpenSearchFieldFactory implementation**

Create `packages/api-opensearch/src/features/OpenSearchField/OpenSearchFieldFactoryImpl.ts`:

```ts
import { OpenSearchFieldFactory } from "./abstractions/OpenSearchFieldFactory.js";
import type { OpenSearchField } from "./abstractions/OpenSearchField.js";
import { OpenSearchFieldImpl } from "./OpenSearchFieldImpl.js";

class OpenSearchFieldFactoryImplClass implements OpenSearchFieldFactory.Interface {
    public create(params: OpenSearchField.Params): OpenSearchField.Interface {
        return new OpenSearchFieldImpl(params);
    }
}

export const OpenSearchFieldFactoryImpl = OpenSearchFieldFactory.createImplementation({
    implementation: OpenSearchFieldFactoryImplClass,
    dependencies: []
});
```

- [ ] **Step 5: Create the feature registration**

Create `packages/api-opensearch/src/features/OpenSearchField/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchFieldFactoryImpl } from "./OpenSearchFieldFactoryImpl.js";

export const OpenSearchFieldFeature = createFeature({
    name: "opensearch.internal.field",
    register(container) {
        container.register(OpenSearchFieldFactoryImpl).inSingletonScope();
    }
});
```

- [ ] **Step 6: Verify the build**

```bash
yarn build -p @webiny/api-opensearch 2>&1 | tail -30
```

Expected: clean build. The new files compile but are not yet wired into consumers.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add OpenSearchField DI abstraction and factory"
```

---

### Task 3: Create OpenSearchIndex DI abstraction + registry

**Files:**
- Create: `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndex.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchIndex/OpenSearchIndexRegistryImpl.ts`
- Create: `packages/api-opensearch/src/features/OpenSearchIndex/feature.ts`

**Interfaces:**
- Consumes: `OpenSearchIndexRequestBody` from `~/types.js`
- Produces:
  - `OpenSearchIndex.Interface` — `readonly body: OpenSearchIndexRequestBody`, `canUse(): boolean`
  - `OpenSearchIndex.Params` — `{ body: OpenSearchIndexRequestBody }`
  - `OpenSearchIndexRegistry.Interface` — `getLastAdded(): OpenSearchIndex.Interface`, `getAll(): OpenSearchIndex.Interface[]`
  - `OpenSearchIndexFeature` — DI feature (empty — no default implementations to register, registry only)

- [ ] **Step 1: Create the OpenSearchIndex abstraction**

Create `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndex.ts`:

```ts
import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchIndexRequestBody } from "~/types.js";

export interface IOpenSearchIndex {
    readonly body: OpenSearchIndexRequestBody;
    canUse(): boolean;
}

export const OpenSearchIndex = createAbstraction<IOpenSearchIndex>("OpenSearch/Index");

export namespace OpenSearchIndex {
    export type Interface = IOpenSearchIndex;
}
```

- [ ] **Step 2: Create the OpenSearchIndexRegistry abstraction**

Create `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.ts`:

```ts
import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchIndex } from "./OpenSearchIndex.js";

export interface IOpenSearchIndexRegistry {
    getLastAdded(): OpenSearchIndex.Interface;
    getAll(): OpenSearchIndex.Interface[];
}

export const OpenSearchIndexRegistry = createAbstraction<IOpenSearchIndexRegistry>(
    "OpenSearch/IndexRegistry"
);

export namespace OpenSearchIndexRegistry {
    export type Interface = IOpenSearchIndexRegistry;
}
```

- [ ] **Step 3: Create the OpenSearchIndexRegistry implementation**

Create `packages/api-opensearch/src/features/OpenSearchIndex/OpenSearchIndexRegistryImpl.ts`:

```ts
import WebinyError from "@webiny/error";
import { OpenSearchIndex } from "./abstractions/OpenSearchIndex.js";
import { OpenSearchIndexRegistry as Abstraction } from "./abstractions/OpenSearchIndexRegistry.js";

class OpenSearchIndexRegistryImplClass implements Abstraction.Interface {
    private readonly indices: OpenSearchIndex.Interface[];

    public constructor(indices: OpenSearchIndex.Interface[]) {
        this.indices = indices;
    }

    public getLastAdded(): OpenSearchIndex.Interface {
        const usable = this.indices.filter(index => index.canUse());
        if (usable.length === 0) {
            throw new WebinyError(
                "Could not find a single OpenSearchIndex.",
                "OPENSEARCH_INDEX_TEMPLATE_ERROR"
            );
        }
        return usable[usable.length - 1];
    }

    public getAll(): OpenSearchIndex.Interface[] {
        return this.indices.filter(index => index.canUse());
    }
}

export const OpenSearchIndexRegistryImpl = Abstraction.createImplementation({
    implementation: OpenSearchIndexRegistryImplClass,
    dependencies: [[OpenSearchIndex, { multiple: true }]]
});
```

- [ ] **Step 4: Create the feature registration**

Create `packages/api-opensearch/src/features/OpenSearchIndex/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchIndexRegistryImpl } from "./OpenSearchIndexRegistryImpl.js";

export const OpenSearchIndexFeature = createFeature({
    name: "opensearch.internal.index",
    register(container) {
        container.register(OpenSearchIndexRegistryImpl).inSingletonScope();
    }
});
```

- [ ] **Step 5: Verify the build**

```bash
yarn build -p @webiny/api-opensearch 2>&1 | tail -30
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add OpenSearchIndex DI abstraction and registry"
```

---

### Task 4: Wire consumers to new DI abstractions

**Files:**
- Modify: `packages/api-opensearch/src/sort.ts`
- Modify: `packages/api-opensearch/src/where.ts`
- Modify: `packages/api-opensearch/src/indices.ts`
- Modify: `packages/api-opensearch/src/utils/createIndex.ts`
- Modify: `packages/api-opensearch/src/index.ts`
- Modify: `packages/api-opensearch/src/exports/api/opensearch.ts`
- Modify: `packages/api-opensearch/src/registerOpenSearchCore.ts`
- Modify: `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/sort.ts`

**Interfaces:**
- Consumes: `OpenSearchField.Interface`, `OpenSearchField.ALL`, `OpenSearchFieldFactory.Interface`, `OpenSearchIndex.Interface`, `OpenSearchIndexRegistry.Interface` from Tasks 2-3
- Produces: updated consumers that no longer depend on plugin classes

- [ ] **Step 1: Update `sort.ts` to use `OpenSearchField.Interface`**

In `packages/api-opensearch/src/sort.ts`, replace the import and type usage:

Replace:
```ts
import { OpenSearchFieldPlugin } from "~/plugins/index.js";
```
With:
```ts
import { OpenSearchField } from "~/features/OpenSearchField/abstractions/OpenSearchField.js";
```

Replace all `OpenSearchFieldPlugin` type references with `OpenSearchField.Interface`, and `OpenSearchFieldPlugin.ALL` with `OpenSearchField.ALL`. The full updated file:

```ts
import WebinyError from "@webiny/error";
import type {
    FieldSortOptions,
    SortOrder,
    SortType
} from "~/types.js";
import { OpenSearchField } from "~/features/OpenSearchField/abstractions/OpenSearchField.js";

const sortRegExp = /^((?:values\.)?[a-zA-Z0-9_@-]+)_(ASC|DESC)$/;

interface CreateSortParams {
    sort: string[];
    defaults?: {
        field?: string;
        order?: SortOrder;
        unmappedType?: string;
    };
    fieldPlugins: Record<string, OpenSearchField.Interface>;
}

export const createSort = (params: CreateSortParams): SortType => {
    const { sort, defaults, fieldPlugins } = params;
    if (!sort || sort.length === 0) {
        const { field, order, unmappedType } = defaults || {};
        return {
            [field || "id.keyword"]: {
                order: order || "desc",
                unmapped_type: (unmappedType || undefined) as any
            }
        };
    }
    const result = sort.reduce(
        (acc, value) => {
            if (typeof value !== "string") {
                throw new WebinyError(`Sort as object is not supported..`);
            }
            const match = value.match(sortRegExp);

            if (!match) {
                throw new WebinyError(`Cannot sort by "${value}".`);
            }

            const [, field, initialOrder] = match;
            const order: SortOrder = initialOrder.toLowerCase() === "asc" ? "asc" : "desc";

            const plugin: OpenSearchField.Interface =
                fieldPlugins[field] || fieldPlugins[OpenSearchField.ALL];
            if (!plugin) {
                throw new WebinyError(
                    `Missing plugin for the field "${field}"`,
                    "PLUGIN_SORT_ERROR",
                    {
                        field
                    }
                );
            }
            const path = plugin.getPath(field);

            acc[path] = plugin.getSortOptions(order);

            return acc;
        },
        {} as Record<string, FieldSortOptions>
    );
    if (!result["id.keyword"] && !result["id"]) {
        result["id.keyword"] = {
            order: "asc"
        };
    }
    return result;
};
```

- [ ] **Step 2: Update `where.ts` to use `OpenSearchField.Interface`**

In `packages/api-opensearch/src/where.ts`, replace the import and type usage:

Replace:
```ts
import { OpenSearchFieldPlugin } from "~/plugins/definition/OpenSearchFieldPlugin.js";
```
With:
```ts
import { OpenSearchField } from "~/features/OpenSearchField/abstractions/OpenSearchField.js";
```

Then replace all `OpenSearchFieldPlugin` references. The full updated file:

```ts
import type { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchField } from "~/features/OpenSearchField/abstractions/OpenSearchField.js";
import type { OpenSearchQueryBuilderOperator } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.js";
import WebinyError from "@webiny/error";

type Records<T> = Record<string, T>;

export interface ApplyWhereParams {
    query: OpenSearchBoolQueryConfig;
    where: Records<any>;
    fields: Records<OpenSearchField.Interface>;
    operators: Records<OpenSearchQueryBuilderOperator.Interface>;
}

export interface ParseWhereKeyResult {
    field: string;
    operator: string;
}

const parseWhereKeyRegExp = new RegExp(/^((?:wbyAco_)?[a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

export const parseWhereKey = (key: string): ParseWhereKeyResult => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;

    if (!field.match(/^(?:wbyAco_)?([a-zA-Z0-9]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    const operator = operation.match(/^_/) ? operation.slice(1) : operation;

    return { field, operator };
};

const ALL = OpenSearchField.ALL;

export const applyWhere = (params: ApplyWhereParams): void => {
    const { query, where, fields, operators } = params;

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const initialValue = where[key];
        if (initialValue === undefined) {
            continue;
        }
        const { field, operator } = parseWhereKey(key);
        const fieldPlugin: OpenSearchField.Interface = fields[field] || fields[ALL];
        if (!fieldPlugin) {
            throw new WebinyError(
                `Missing plugin for the field "${field}".`,
                "PLUGIN_WHERE_ERROR",
                {
                    field
                }
            );
        }
        const operatorInstance = operators[operator];
        if (!operatorInstance) {
            throw new WebinyError(
                `Missing plugin for the operator "${operator}"`,
                "PLUGIN_WHERE_ERROR",
                {
                    operator
                }
            );
        }

        const path = fieldPlugin.getPath(field);
        const basePath = fieldPlugin.getBasePath(field);
        const value = fieldPlugin.toSearchValue({
            value: initialValue,
            path,
            basePath
        });

        operatorInstance.apply(query, {
            name: field,
            value,
            path,
            basePath,
            keyword: fieldPlugin.keyword
        });
    }
};
```

- [ ] **Step 3: Update `indices.ts` to use `OpenSearchIndexRegistry`**

Replace the entire `packages/api-opensearch/src/indices.ts` with:

```ts
import { OpenSearchIndexRegistry } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.js";

export { OpenSearchIndexRegistry };
```

The old `getLastAddedIndexPlugin` function is replaced by `OpenSearchIndexRegistry.getLastAdded()`. The only internal consumer is `utils/createIndex.ts`, updated in the next step.

- [ ] **Step 4: Update `utils/createIndex.ts` to use DI abstractions**

Replace `packages/api-opensearch/src/utils/createIndex.ts`:

```ts
import type { Client } from "~/client.js";
import type { OpenSearchIndex } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndex.js";
import WebinyError from "@webiny/error";

interface OnExists {
    (): void;
}

interface OnError {
    (ex: Error): Error;
}

interface ExistsIndexParams {
    client: Client;
    index: string;
    onExists?: OnExists;
}

const indexExists = async (params: ExistsIndexParams): Promise<boolean> => {
    const { client, index, onExists } = params;

    try {
        const response = await client.indices.exists({
            index,
            ignore_unavailable: false,
            allow_no_indices: true,
            include_defaults: true,
            flat_settings: false,
            local: false
        });
        if (!response.body) {
            return false;
        }
        if (onExists) {
            onExists();
        }
        return true;
    } catch {
        console.error(`Could not determine if the index "${index}" exists.`);
    }
    return false;
};

interface IndexCreateParams {
    client: Client;
    index: string;
    type: string;
    tenant: string;
    plugin: OpenSearchIndex.Interface;
    onError?: OnError;
}

const indexCreate = async (params: IndexCreateParams): Promise<void> => {
    const { client, index, plugin, tenant, type, onError } = params;

    try {
        await client.indices.create({
            index,
            body: {
                ...plugin.body
            }
        });
    } catch (ex) {
        let error = ex;
        if (onError) {
            error = onError(ex);
        }
        throw new WebinyError(
            error.message || `Could not create OpenSearch index for the ${type}.`,
            error.code || "CREATE_OPENSEARCH_INDEX_ERROR",
            {
                error: {
                    ...error,
                    message: error.message,
                    code: error.code,
                    data: error.data
                },
                type,
                tenant,
                index,
                body: plugin.body
            }
        );
    }
};

interface CreateIndexParams {
    client: Client;
    plugin: OpenSearchIndex.Interface;
    type: string;
    tenant: string;
    index: string;
    onExists?: OnExists;
    onError?: OnError;
}

export const createIndex = async (params: CreateIndexParams): Promise<void> => {
    const { plugin, onExists } = params;

    const exists = await indexExists(params);
    if (exists) {
        if (onExists) {
            onExists();
        }
        return;
    }

    await indexCreate({
        ...params,
        plugin
    });
};
```

Key change: `CreateIndexParams` takes `plugin: OpenSearchIndex.Interface` instead of `plugins: PluginsContainer` + `type: string`. The caller resolves the index from the registry before calling `createIndex`.

- [ ] **Step 5: Update exports**

In `packages/api-opensearch/src/exports/api/opensearch.ts`, add the new abstraction exports:

```ts
export { createOpenSearchClient } from "~/client.js";
export { OpenSearchClient } from "~/features/OpenSearchClient/abstraction.js";
export { OpenSearchClientFactory } from "~/features/OpenSearchClientFactory/abstraction.js";
export { OpenSearchQueryBuilderOperator } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.js";
export { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";
export { OpenSearchField } from "~/features/OpenSearchField/abstractions/OpenSearchField.js";
export { OpenSearchFieldFactory } from "~/features/OpenSearchField/abstractions/OpenSearchFieldFactory.js";
export { OpenSearchIndex } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndex.js";
export { OpenSearchIndexRegistry } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.js";
```

- [ ] **Step 6: Register features in `registerOpenSearchCore`**

In `packages/api-opensearch/src/registerOpenSearchCore.ts`, add the new feature registrations:

```ts
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { OpenSearchClientFeature } from "~/features/OpenSearchClient/feature.js";
import { OpenSearchClientFactoryFeature } from "~/features/OpenSearchClientFactory/feature.js";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchFieldFeature } from "~/features/OpenSearchField/feature.js";
import { OpenSearchIndexFeature } from "~/features/OpenSearchIndex/feature.js";
import type { OpenSearchClientOptions } from "~/client.js";
import { Client, createOpenSearchClient } from "~/client.js";

export const registerOpenSearchCore = (params: OpenSearchClientOptions | Client) => {
    return createRegisterExtensionPlugin(async context => {
        // @ts-expect-error
        if (context.__registeredOpensearch) {
            throw new Error("OpenSearch core must not be loaded more than once!");
        }
        const client = params instanceof Client ? params : createOpenSearchClient(params);
        // @ts-expect-error
        context.__registeredOpensearch = true;

        OpenSearchClientFeature.register(context.container, client);
        OpenSearchClientFactoryFeature.register(context.container);
        OpenSearchQueryBuilderOperatorFeature.register(context.container);
        OpenSearchFieldFeature.register(context.container);
        OpenSearchIndexFeature.register(context.container);
    });
};
```

- [ ] **Step 7: Update CMS sort consumer to use factory**

In `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/sort.ts`:

Replace:
```ts
import { createSort, OpenSearchFieldPlugin } from "@webiny/api-opensearch";
```
With:
```ts
import { createSort } from "@webiny/api-opensearch";
import type { OpenSearchField } from "@webiny/api-opensearch/exports/api/opensearch";
import { OpenSearchFieldImpl } from "@webiny/api-opensearch/features/OpenSearchField/OpenSearchFieldImpl";
```

Then replace all `OpenSearchFieldPlugin` references:

```ts
    const sortPlugins = Object.values(modelFields).reduce<Record<string, OpenSearchField.Interface>>(
        (plugins, field) => {
            const isValues = field.parents.length === 1 && field.parents[0].fieldId === "values";
            if (field.parents.length > 0 && !isValues) {
                return plugins;
            }

            const fieldId = field.field.fieldId;
            const fieldIdPath = isValues ? `values.${fieldId}` : fieldId;

            fieldIdToStorageIdIdMap[fieldIdPath] = fieldIdPath;

            const { path } = createFieldPath({
                key: field.field.storageId,
                field,
                value: NoValueContainer.create(),
                keyword: false,
                originalValue: NoValueContainer.create()
            });
            plugins[fieldIdPath] = new OpenSearchFieldImpl({
                unmappedType: field.unmappedType,
                keyword: hasKeyword(field),
                sortable: field.sortable,
                searchable: field.searchable,
                field: fieldId,
                path
            });
            return plugins;
        },
        {
            ["*"]: new OpenSearchFieldImpl({
                field: "*",
                keyword: false
            })
        }
    );
```

- [ ] **Step 8: Build both packages**

```bash
yarn build -p @webiny/api-opensearch 2>&1 | tail -30
yarn build -p @webiny/api-headless-cms-ddb-es 2>&1 | tail -30
```

Expected: both build clean.

- [ ] **Step 9: Run tests**

```bash
yarn test packages/api-opensearch 2>&1 | tail -50
```

Expected: all 56 tests pass.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "refactor: wire consumers to OpenSearchField and OpenSearchIndex DI abstractions"
```

---

### Task 5: Delete old plugin files and clean up exports

**Files:**
- Delete: `packages/api-opensearch/src/plugins/definition/OpenSearchFieldPlugin.ts`
- Delete: `packages/api-opensearch/src/plugins/definition/OpenSearchIndexPlugin.ts`
- Delete: `packages/api-opensearch/src/plugins/definition/index.ts`
- Modify: `packages/api-opensearch/src/plugins/index.ts`
- Modify: `packages/api-opensearch/src/index.ts`

**Interfaces:**
- Consumes: all consumers already migrated in Task 4
- Produces: clean package with no `plugins/definition/` directory

- [ ] **Step 1: Delete the old plugin definition files**

```bash
rm packages/api-opensearch/src/plugins/definition/OpenSearchFieldPlugin.ts
rm packages/api-opensearch/src/plugins/definition/OpenSearchIndexPlugin.ts
rm packages/api-opensearch/src/plugins/definition/index.ts
rmdir packages/api-opensearch/src/plugins/definition
```

- [ ] **Step 2: Update or remove `plugins/index.ts`**

Check if `packages/api-opensearch/src/plugins/index.ts` has any other exports besides the definition barrel. If it only re-exports definition, delete it. If it has other content, remove the definition line.

Current content is `export * from "./definition/index.js";`. Delete the file:

```bash
rm packages/api-opensearch/src/plugins/index.ts
```

Check if `packages/api-opensearch/src/plugins/` has any remaining content. If the `operator/` directory was already deleted in the previous session, remove the empty `plugins/` directory:

```bash
ls packages/api-opensearch/src/plugins/
# If empty:
rmdir packages/api-opensearch/src/plugins
```

- [ ] **Step 3: Update main `index.ts`**

In `packages/api-opensearch/src/index.ts`, remove:
```ts
export * from "./plugins/index.js";
```

And remove the `indices.ts` re-export if it's now just re-exporting the registry (already available via `exports/api/opensearch.ts`):
```ts
export * from "./indices.js";
```

- [ ] **Step 4: Build and test**

```bash
yarn build -p @webiny/api-opensearch 2>&1 | tail -30
yarn build -p @webiny/api-headless-cms-ddb-es 2>&1 | tail -30
yarn test packages/api-opensearch 2>&1 | tail -50
```

Expected: all builds clean, all tests pass. If any external consumer was importing from the old `plugins/definition/` path, fix that import.

- [ ] **Step 5: Run pre-commit checks and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "refactor: delete old plugin definition files, clean up exports"
```
