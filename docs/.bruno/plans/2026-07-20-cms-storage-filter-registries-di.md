# CMS Storage Filter Registries DI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `PluginsContainer` threading with 4 DI-resolvable registries in `api-headless-cms-storage`, `api-headless-cms-sql`, `api-headless-cms-pg-os`.

**Architecture:** Each of the 4 plugin types (`CmsEntryFieldFilterPathPlugin`, `CmsFieldFilterValueTransformPlugin`, `CmsEntryFieldFilterPlugin`, `CmsEntryFieldSortingPlugin`) gets a DI abstraction (typed map registry), implementation, and handler factories. A single `FilterRegistriesFeature` populates all registries at container setup. Consumer functions (`createFields`, `createExpressions`, `filter`, `sort`) switch from `plugins.byType()` to registry lookups. The `plugins: PluginsContainer` param is removed from the entire threading chain.

**Tech Stack:** `@webiny/di` (Abstraction), `@webiny/feature` (createFeature), vitest

## Global Constraints

- One abstraction/implementation per file — never combine multiple
- No inline type definitions in interfaces — extract to named types
- Export name matches abstraction name
- Use namespace pattern for `.Interface` and `.Handler` types
- `@webiny/feature` must be added as dependency to `api-headless-cms-storage/package.json`
- Plugin classes and factory functions stay unchanged (ddb/ddb-es backward compat)
- All existing tests must continue passing

---

### Task 1: FieldFilterPathRegistry — Abstraction + Implementation

**Files:**
- Create: `packages/api-headless-cms-storage/src/abstractions/FieldFilterPathRegistry.ts`
- Create: `packages/api-headless-cms-storage/src/implementations/FieldFilterPathRegistryImpl.ts`

**Interfaces:**
- Consumes: `Abstraction` from `@webiny/di`, `CreatePathCallableParams` from `../plugins/CmsEntryFieldFilterPathPlugin.js`
- Produces: `FieldFilterPathRegistry` abstraction with `.Interface` and `.Handler` namespace types. Used by Task 5 (createFields), Task 9 (feature), Task 10 (sql), Task 11 (pg-os).

- [ ] **Step 1: Create the abstraction file**

```typescript
// packages/api-headless-cms-storage/src/abstractions/FieldFilterPathRegistry.ts
import { Abstraction } from "@webiny/di";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CreatePathCallableParams } from "../plugins/CmsEntryFieldFilterPathPlugin.js";

export interface IFieldFilterPathHandler {
    canUse(field: Pick<CmsModelField, "fieldId" | "type">, parents: string[]): boolean;
    createPath(params: CreatePathCallableParams): string;
}

export interface IFieldFilterPathRegistry {
    register(fieldType: string, handler: IFieldFilterPathHandler): void;
    get(fieldType: string): IFieldFilterPathHandler | undefined;
}

export const FieldFilterPathRegistry = new Abstraction<IFieldFilterPathRegistry>(
    "Cms/Storage/FieldFilterPathRegistry"
);

export namespace FieldFilterPathRegistry {
    export type Interface = IFieldFilterPathRegistry;
    export type Handler = IFieldFilterPathHandler;
}
```

- [ ] **Step 2: Create the implementation file**

```typescript
// packages/api-headless-cms-storage/src/implementations/FieldFilterPathRegistryImpl.ts
import type { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";

export class FieldFilterPathRegistryImpl implements FieldFilterPathRegistry.Interface {
    private readonly handlers = new Map<string, FieldFilterPathRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterPathRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterPathRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: successful build (new files compiled, no errors)

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-storage/src/abstractions/FieldFilterPathRegistry.ts \
       packages/api-headless-cms-storage/src/implementations/FieldFilterPathRegistryImpl.ts
git commit -m "feat(api-headless-cms-storage): add FieldFilterPathRegistry abstraction and implementation"
```

---

### Task 2: FieldFilterValueTransformRegistry — Abstraction + Implementation

**Files:**
- Create: `packages/api-headless-cms-storage/src/abstractions/FieldFilterValueTransformRegistry.ts`
- Create: `packages/api-headless-cms-storage/src/implementations/FieldFilterValueTransformRegistryImpl.ts`

**Interfaces:**
- Consumes: `Abstraction` from `@webiny/di`, `CmsFieldFilterValueTransformParams` from `../plugins/CmsFieldFilterValueTransformPlugin.js`
- Produces: `FieldFilterValueTransformRegistry` abstraction with `.Interface` and `.Handler` namespace types. Used by Task 5 (createFields), Task 6 (createExpressions), Task 9 (feature), Task 10, Task 11.

- [ ] **Step 1: Create the abstraction file**

```typescript
// packages/api-headless-cms-storage/src/abstractions/FieldFilterValueTransformRegistry.ts
import { Abstraction } from "@webiny/di";
import type { CmsFieldFilterValueTransformParams } from "../plugins/CmsFieldFilterValueTransformPlugin.js";

export interface IFieldFilterValueTransformHandler {
    transform(params: CmsFieldFilterValueTransformParams): any;
}

export interface IFieldFilterValueTransformRegistry {
    register(fieldType: string, handler: IFieldFilterValueTransformHandler): void;
    get(fieldType: string): IFieldFilterValueTransformHandler | undefined;
}

export const FieldFilterValueTransformRegistry =
    new Abstraction<IFieldFilterValueTransformRegistry>(
        "Cms/Storage/FieldFilterValueTransformRegistry"
    );

export namespace FieldFilterValueTransformRegistry {
    export type Interface = IFieldFilterValueTransformRegistry;
    export type Handler = IFieldFilterValueTransformHandler;
}
```

- [ ] **Step 2: Create the implementation file**

```typescript
// packages/api-headless-cms-storage/src/implementations/FieldFilterValueTransformRegistryImpl.ts
import type { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";

export class FieldFilterValueTransformRegistryImpl
    implements FieldFilterValueTransformRegistry.Interface
{
    private readonly handlers = new Map<string, FieldFilterValueTransformRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterValueTransformRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterValueTransformRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-storage/src/abstractions/FieldFilterValueTransformRegistry.ts \
       packages/api-headless-cms-storage/src/implementations/FieldFilterValueTransformRegistryImpl.ts
git commit -m "feat(api-headless-cms-storage): add FieldFilterValueTransformRegistry abstraction and implementation"
```

---

### Task 3: FieldFilterCreateRegistry — Abstraction + Implementation

**Files:**
- Create: `packages/api-headless-cms-storage/src/abstractions/FieldFilterCreateRegistry.ts`
- Create: `packages/api-headless-cms-storage/src/implementations/FieldFilterCreateRegistryImpl.ts`

**Interfaces:**
- Consumes: `Abstraction` from `@webiny/di`, `CmsEntryFieldFilterPluginCreateResponse` and `CmsEntryFieldFilterPlugin` create params types from `../plugins/CmsEntryFieldFilterPlugin.js`
- Produces: `FieldFilterCreateRegistry` abstraction with `.Interface` and `.Handler` namespace types, including `getDefault()`. Used by Task 6 (createExpressions), Task 9 (feature), Task 10, Task 11.

The handler `create()` params must include `getHandler` callback and `transformRegistry` for recursive lookups (objectFilterCreate delegates to defaultFilterCreate for nested object fields).

- [ ] **Step 1: Create the abstraction file**

The `IFieldFilterCreateParams` mirrors `CmsEntryFieldFilterPluginCreateParams` but replaces `transformValuePlugins: Record<string, ICmsFieldFilterValueTransformPlugin>` with `transformRegistry: FieldFilterValueTransformRegistry.Interface` and `getFilterCreatePlugin` with `getHandler: (fieldType: string) => IFieldFilterCreateHandler`.

```typescript
// packages/api-headless-cms-storage/src/abstractions/FieldFilterCreateRegistry.ts
import { Abstraction } from "@webiny/di";
import type { Field } from "../filtering/fields/types.js";
import type { ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterValueTransformRegistry } from "./FieldFilterValueTransformRegistry.js";

export interface IFieldFilterCreateResult {
    field: Field;
    path: string;
    fieldPathId: string;
    filter: ValueFilterRegistry.Filter;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface IFieldFilterCreateParams<T = any> {
    key: string;
    value: T;
    field: Field;
    fields: Record<string, Field>;
    operation: string;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    getHandler: (fieldType: string) => IFieldFilterCreateHandler;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface IFieldFilterCreateHandler {
    create(
        params: IFieldFilterCreateParams
    ): null | IFieldFilterCreateResult | IFieldFilterCreateResult[];
}

export interface IFieldFilterCreateRegistry {
    register(fieldType: string, handler: IFieldFilterCreateHandler): void;
    get(fieldType: string): IFieldFilterCreateHandler | undefined;
    getDefault(): IFieldFilterCreateHandler;
}

export const FieldFilterCreateRegistry = new Abstraction<IFieldFilterCreateRegistry>(
    "Cms/Storage/FieldFilterCreateRegistry"
);

export namespace FieldFilterCreateRegistry {
    export type Interface = IFieldFilterCreateRegistry;
    export type Handler = IFieldFilterCreateHandler;
    export type Params = IFieldFilterCreateParams;
    export type Result = IFieldFilterCreateResult;
}
```

- [ ] **Step 2: Create the implementation file**

```typescript
// packages/api-headless-cms-storage/src/implementations/FieldFilterCreateRegistryImpl.ts
import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";

export class FieldFilterCreateRegistryImpl implements FieldFilterCreateRegistry.Interface {
    private readonly handlers = new Map<string, FieldFilterCreateRegistry.Handler>();

    public register(fieldType: string, handler: FieldFilterCreateRegistry.Handler): void {
        this.handlers.set(fieldType, handler);
    }

    public get(fieldType: string): FieldFilterCreateRegistry.Handler | undefined {
        return this.handlers.get(fieldType);
    }

    public getDefault(): FieldFilterCreateRegistry.Handler {
        const handler = this.handlers.get("*");
        if (!handler) {
            throw new WebinyError(
                "No default filter create handler registered.",
                "MISSING_DEFAULT_HANDLER"
            );
        }
        return handler;
    }
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-storage/src/abstractions/FieldFilterCreateRegistry.ts \
       packages/api-headless-cms-storage/src/implementations/FieldFilterCreateRegistryImpl.ts
git commit -m "feat(api-headless-cms-storage): add FieldFilterCreateRegistry abstraction and implementation"
```

---

### Task 4: FieldSortingRegistry — Abstraction + Implementation

**Files:**
- Create: `packages/api-headless-cms-storage/src/abstractions/FieldSortingRegistry.ts`
- Create: `packages/api-headless-cms-storage/src/implementations/FieldSortingRegistryImpl.ts`

**Interfaces:**
- Consumes: `Abstraction` from `@webiny/di`, `Field` from `../filtering/fields/types.js`, `CmsModel` from `@webiny/api-headless-cms/types/index.js`
- Produces: `FieldSortingRegistry` abstraction with `.Interface` and `.Handler` namespace types. Used by Task 8 (extractSort/sort), Task 9 (feature), Task 10, Task 11.

- [ ] **Step 1: Create the abstraction file**

```typescript
// packages/api-headless-cms-storage/src/abstractions/FieldSortingRegistry.ts
import { Abstraction } from "@webiny/di";
import type { Field } from "../filtering/fields/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IFieldSortingCanUseParams {
    model: CmsModel;
    field?: Field;
    fieldId: string;
    order: "ASC" | "DESC";
    sortBy: string;
}

export interface IFieldSortingCreateParams {
    model: CmsModel;
    fieldId: string;
    order: "ASC" | "DESC";
    sortBy: string;
    fields: Record<string, Field>;
    field?: Field;
}

export interface IFieldSortingResult {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

export interface IFieldSortingHandler {
    canUse(params: IFieldSortingCanUseParams): boolean;
    createSort(params: IFieldSortingCreateParams): IFieldSortingResult;
}

export interface IFieldSortingRegistry {
    register(handler: IFieldSortingHandler): void;
    find(params: IFieldSortingCanUseParams): IFieldSortingHandler | undefined;
}

export const FieldSortingRegistry = new Abstraction<IFieldSortingRegistry>(
    "Cms/Storage/FieldSortingRegistry"
);

export namespace FieldSortingRegistry {
    export type Interface = IFieldSortingRegistry;
    export type Handler = IFieldSortingHandler;
    export type CanUseParams = IFieldSortingCanUseParams;
    export type CreateParams = IFieldSortingCreateParams;
    export type Result = IFieldSortingResult;
}
```

- [ ] **Step 2: Create the implementation file**

```typescript
// packages/api-headless-cms-storage/src/implementations/FieldSortingRegistryImpl.ts
import type { FieldSortingRegistry } from "../abstractions/FieldSortingRegistry.js";

export class FieldSortingRegistryImpl implements FieldSortingRegistry.Interface {
    private readonly handlers: FieldSortingRegistry.Handler[] = [];

    public register(handler: FieldSortingRegistry.Handler): void {
        this.handlers.push(handler);
    }

    public find(params: FieldSortingRegistry.CanUseParams): FieldSortingRegistry.Handler | undefined {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i].canUse(params)) {
                return this.handlers[i];
            }
        }
        return undefined;
    }
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-storage/src/abstractions/FieldSortingRegistry.ts \
       packages/api-headless-cms-storage/src/implementations/FieldSortingRegistryImpl.ts
git commit -m "feat(api-headless-cms-storage): add FieldSortingRegistry abstraction and implementation"
```

---

### Task 5: Refactor createFields() to use registries

**Files:**
- Modify: `packages/api-headless-cms-storage/src/filtering/fields/createFields.ts`

**Interfaces:**
- Consumes: `FieldFilterPathRegistry.Interface` (Task 1), `FieldFilterValueTransformRegistry.Interface` (Task 2)
- Produces: Updated `createFields(params)` where `Params` uses registries instead of `PluginsContainer`. Called by Task 10 (`listEntries` in sql).

- [ ] **Step 1: Update createFields to accept registries**

Replace the `Params` interface and `createFields` body. The key change: instead of `getMappedPlugins()` which returns `Record<string, Plugin>`, we use the registries directly. The `createFieldCollection` params change from `Record<string, ICmsFieldFilterValueTransformPlugin>` and `Record<string, CmsEntryFieldFilterPathPlugin>` to the registry interfaces.

```typescript
// packages/api-headless-cms-storage/src/filtering/fields/createFields.ts
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createSystemFields } from "./systemFields.js";
import type { Field, FieldParent } from "./types.js";
import type { FieldFilterPathRegistry } from "../../abstractions/FieldFilterPathRegistry.js";
import type { FieldFilterValueTransformRegistry } from "../../abstractions/FieldFilterValueTransformRegistry.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface Params {
    fields: CmsModelField[];
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
}

interface FieldCollection {
    [key: string]: Field;
}

interface AddFieldsToCollectionParams {
    fields: CmsModelField[];
    parents: FieldParent[];
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    system: boolean;
}

const createFieldCollection = (params: AddFieldsToCollectionParams): FieldCollection => {
    const { fields, parents, pathRegistry, transformRegistry, system } = params;
    return fields.reduce<FieldCollection>((collection, field) => {
        const fieldType = getBaseFieldType(field);
        const transformHandler = transformRegistry.get(fieldType);
        const pathHandler = pathRegistry.get(fieldType);

        const fieldId = [
            ...parents,
            {
                fieldId: field.fieldId,
                list: field.list
            }
        ]
            .map(f => f.fieldId)
            .join(".");

        collection[fieldId] = {
            ...field,
            parents,
            system,
            createPath: pathParams => {
                if (
                    pathHandler &&
                    pathHandler.canUse(
                        field,
                        parents.map(p => p.fieldId)
                    )
                ) {
                    return pathHandler.createPath(pathParams);
                }

                return parents
                    .map(parent => parent.fieldId)
                    .concat([pathParams.field.fieldId])
                    .join(".");
            },
            transform: value => {
                if (!transformHandler) {
                    return value;
                }
                return transformHandler.transform({
                    field,
                    value
                });
            }
        };
        const childFields = field.settings?.fields;
        if (!childFields?.length) {
            return collection;
        }

        const result = createFieldCollection({
            fields: childFields,
            parents: [
                ...parents,
                {
                    fieldId: field.fieldId,
                    list: field.list
                }
            ],
            pathRegistry,
            transformRegistry,
            system
        });
        Object.assign(collection, result);
        return collection;
    }, {});
};

export const createFields = (params: Params) => {
    const { fields, pathRegistry, transformRegistry } = params;

    const collection = createFieldCollection({
        fields: createSystemFields(),
        pathRegistry,
        transformRegistry,
        parents: [],
        system: true
    });

    const result = createFieldCollection({
        fields,
        pathRegistry,
        transformRegistry,
        parents: [
            {
                fieldId: "values",
                list: false
            }
        ],
        system: false
    });

    return {
        ...collection,
        ...result
    };
};
```

- [ ] **Step 2: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: build may fail if other files in this package still import old signature — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-storage/src/filtering/fields/createFields.ts
git commit -m "refactor(api-headless-cms-storage): createFields uses registries instead of PluginsContainer"
```

---

### Task 6: Refactor createExpressions() to use registries

**Files:**
- Modify: `packages/api-headless-cms-storage/src/filtering/expressions/createExpressions.ts`

**Interfaces:**
- Consumes: `FieldFilterCreateRegistry.Interface` (Task 3), `FieldFilterValueTransformRegistry.Interface` (Task 2)
- Produces: Updated `createExpressions(params)` where `ICreateExpressionsParams` uses registries instead of `PluginsContainer`. Called by Task 7 (filter).

- [ ] **Step 1: Update createExpressions to accept registries**

Replace `plugins: PluginsContainer` with `filterCreateRegistry` and `transformRegistry`. Replace `getMappedPlugins()` calls with registry lookups. The `getFilterCreatePlugin` callback becomes `getHandler` that delegates to the registry.

```typescript
// packages/api-headless-cms-storage/src/filtering/expressions/createExpressions.ts
import WebinyError from "@webiny/error";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { Field } from "../fields/types.js";
import { extractWhereParams } from "../where.js";
import { transformValue } from "../transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { ValueFilter, ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterCreateRegistry } from "../../abstractions/FieldFilterCreateRegistry.js";
import type { FieldFilterValueTransformRegistry } from "../../abstractions/FieldFilterValueTransformRegistry.js";
import { getWhereValues } from "../values.js";

interface CreateExpressionParams {
    where: Partial<CmsEntryListWhere>;
    condition: ExpressionCondition;
}

interface ICreateExpressionsParams {
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
}

export type ExpressionCondition = "AND" | "OR";

export interface Expression {
    expressions: Expression[];
    filters: Filter[];
    condition: ExpressionCondition;
}

export interface Filter {
    field: Field;
    path: string;
    fieldPathId: string;
    filter: ValueFilter.Interface;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export const createExpressions = (params: ICreateExpressionsParams): Expression => {
    const { where, filterCreateRegistry, transformRegistry, fields, valueFilterRegistry } = params;

    const getHandler = (type: string) => {
        const fieldType = getBaseFieldType({ type });
        const handler = filterCreateRegistry.get(fieldType) || filterCreateRegistry.getDefault();
        if (handler) {
            return handler;
        }
        throw new WebinyError(
            `There is no filter create handler for the field type "${fieldType}".`,
            "MISSING_FILTER_CREATE_HANDLER",
            { fieldType }
        );
    };

    const createExpression = ({ where, condition }: CreateExpressionParams): Expression => {
        const expression: Expression = {
            filters: [],
            expressions: [],
            condition
        };

        for (const key in where) {
            const value = where[key as keyof typeof where];
            if (value === undefined) {
                continue;
            }

            if (key === "AND") {
                const childWhereList = getWhereValues(value, key);
                const childExpression: Expression = {
                    condition: "AND",
                    filters: [],
                    expressions: []
                };
                for (const childWhere of childWhereList) {
                    const result = createExpression({
                        where: childWhere,
                        condition: "AND"
                    });
                    childExpression.expressions.push(result);
                }
                expression.expressions.push(childExpression);
                continue;
            }
            if (key === "OR") {
                const childWhereList = getWhereValues(value, key);
                const childExpression: Expression = {
                    condition: "OR",
                    filters: [],
                    expressions: []
                };
                for (const childWhere of childWhereList) {
                    const result = createExpression({
                        where: childWhere,
                        condition: "AND"
                    });
                    childExpression.expressions.push(result);
                }
                expression.expressions.push(childExpression);
                continue;
            }

            const whereParams = extractWhereParams(key);
            if (!whereParams) {
                continue;
            }

            const { fieldId, operation, negate } = whereParams;

            const field = fields[fieldId];
            if (!field) {
                throw new WebinyError(
                    `There is no field with the fieldId "${fieldId}".`,
                    "FIELD_ERROR",
                    { fieldId }
                );
            }

            const handler = getHandler(field.type);
            const fieldType = getBaseFieldType(field);
            const transformHandler = transformRegistry.get(fieldType);

            const transformValueCallable = (value: any) => {
                if (!transformHandler) {
                    return value;
                }
                return transformHandler.transform({ field, value });
            };

            const result = handler.create({
                key,
                value,
                valueFilterRegistry,
                transformRegistry,
                getHandler,
                operation,
                negate,
                field,
                fields,
                compareValue: transformValue({
                    value,
                    transform: transformValueCallable
                }),
                transformValue: transformValueCallable
            });

            if (!result || (Array.isArray(result) && result.length === 0)) {
                continue;
            }

            expression.filters.push(...(Array.isArray(result) ? result : [result]));
        }

        return expression;
    };

    const expression = createExpression({
        where,
        condition: "AND"
    });

    if (expression.filters.length > 0 || expression.expressions.length !== 1) {
        return expression;
    }
    return expression.expressions[0];
};
```

**Note:** This file still imports `getWhereValues` from `../values.js` — that import stays unchanged. The import of `getMappedPlugins` is removed.

- [ ] **Step 2: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-storage/src/filtering/expressions/createExpressions.ts
git commit -m "refactor(api-headless-cms-storage): createExpressions uses registries instead of PluginsContainer"
```

---

### Task 7: Refactor filter() to use registries

**Files:**
- Modify: `packages/api-headless-cms-storage/src/filtering/filter.ts`

**Interfaces:**
- Consumes: `FieldFilterCreateRegistry.Interface` (Task 3), `FieldFilterValueTransformRegistry.Interface` (Task 2), updated `createExpressions()` (Task 6)
- Produces: Updated `filter(params)` where `IFilterParams` uses registries instead of `PluginsContainer`. Called by Task 10 (`listEntries` in sql).

- [ ] **Step 1: Update filter to accept registries**

Replace `plugins: PluginsContainer` with `filterCreateRegistry` and `transformRegistry`. Pass them to `createExpressions`.

```typescript
// packages/api-headless-cms-storage/src/filtering/filter.ts
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryValues
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import type { Field } from "./fields/types.js";
import { createFullTextSearch } from "./fullTextSearch.js";
import type { Expression, ExpressionCondition, Filter } from "./expressions/createExpressions.js";
import { createExpressions } from "./expressions/createExpressions.js";
import { transformValue } from "./transform.js";
import { getValue } from "./getValue.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import type { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";

interface ExecuteFilterParams {
    value: any;
    filter: Filter;
}

const executeFilter = (params: ExecuteFilterParams) => {
    const { value, filter } = params;

    const canUse = filter.filter.canUse({
        value,
        compareValue: filter.compareValue
    });
    if (!canUse) {
        return true;
    }

    const matched = filter.filter.matches({
        value,
        compareValue: filter.compareValue
    });
    if (filter.negate) {
        return matched === false;
    }
    return matched;
};

interface ExecuteExpressionsParams {
    getCachedValue: (filter: Filter) => Promise<any>;
    expressions: Expression[];
    filters: Filter[];
    condition: ExpressionCondition;
}

const executeExpressions = (params: ExecuteExpressionsParams): boolean => {
    const { expressions, getCachedValue, filters, condition } = params;
    if (expressions.length === 0 && filters.length === 0) {
        return true;
    }
    for (const filter of filters) {
        const value = getCachedValue(filter);

        const result = executeFilter({
            value,
            filter
        });
        if (!result) {
            return false;
        }
    }
    for (const expression of expressions) {
        const result = executeExpressions({
            ...expression,
            getCachedValue
        });
        if (result && condition === "OR") {
            return true;
        } else if (!result && condition == "AND") {
            return false;
        }
    }
    return condition === "OR" ? false : true;
};

interface IFilterParams<T extends CmsEntryValues = CmsEntryValues> {
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    items: CmsEntry<T>[];
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
    fullTextSearch?: {
        term?: string;
        fields?: string[];
    };
}

export const filter = <T extends CmsEntryValues = CmsEntryValues>(
    params: IFilterParams<T>
): CmsEntry<T>[] => {
    const {
        items: records,
        where,
        filterCreateRegistry,
        transformRegistry,
        fields,
        fullTextSearch,
        valueFilterRegistry
    } = params;

    const keys = Object.keys(where);
    if (keys.length === 0 && !fullTextSearch) {
        return records;
    }
    const expression = createExpressions({
        filterCreateRegistry,
        transformRegistry,
        where,
        fields,
        valueFilterRegistry
    });

    if (
        expression.filters.length === 0 &&
        expression.expressions.length === 0 &&
        !fullTextSearch?.term
    ) {
        return records;
    }
    const fullTextSearchFilter = valueFilterRegistry.get("contains");
    if (!fullTextSearchFilter) {
        throw new WebinyError(
            `Missing "contains" plugin to run the full-text search.`,
            "MISSING_PLUGIN"
        );
    }

    const search = createFullTextSearch({
        term: fullTextSearch?.term,
        targetFields: fullTextSearch?.fields,
        fields,
        filter: fullTextSearchFilter
    });

    return records.filter(record => {
        const cachedValues: Record<string, any> = {};

        const getCachedValue = (filter: Filter) => {
            const { path } = filter;
            if (cachedValues[path] !== undefined) {
                return cachedValues[path];
            }
            const plainValue = getValue(record, path);

            const rawValue = transformValue({
                value: plainValue,
                transform: filter.transformValue
            });

            cachedValues[path] = rawValue;
            return rawValue;
        };

        const exprResult = executeExpressions({ ...expression, getCachedValue });
        if (!exprResult || !search) {
            return exprResult;
        }

        return search(record);
    });
};
```

- [ ] **Step 2: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-storage/src/filtering/filter.ts
git commit -m "refactor(api-headless-cms-storage): filter uses registries instead of PluginsContainer"
```

---

### Task 8: Refactor extractSort() and sort() to use registry

**Files:**
- Modify: `packages/api-headless-cms-storage/src/filtering/fields/extractSort.ts`
- Modify: `packages/api-headless-cms-storage/src/filtering/sort.ts`

**Interfaces:**
- Consumes: `FieldSortingRegistry.Interface` (Task 4)
- Produces: Updated `sort(params)` and `extractSort(params)` where params use `sortingRegistry` instead of `PluginsContainer`. Called by Task 10 (`listEntries` in sql).

- [ ] **Step 1: Update extractSort to accept registry**

```typescript
// packages/api-headless-cms-storage/src/filtering/fields/extractSort.ts
import WebinyError from "@webiny/error";
import type { Field } from "./types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { FieldSortingRegistry } from "../../abstractions/FieldSortingRegistry.js";

const extractSortInfo = (sortBy: string) => {
    const rootSorting = sortBy.match(/^([a-zA-Z]+)_(ASC|DESC)$/);
    if (rootSorting) {
        return {
            fieldId: rootSorting[1],
            isValues: false,
            order: rootSorting[2] as "ASC" | "DESC"
        };
    }
    const valuesSorting = sortBy.match(/^values_([a-zA-Z0-9]+)_(ASC|DESC)$/);
    if (valuesSorting) {
        return {
            fieldId: valuesSorting[1],
            isValues: true,
            order: valuesSorting[2] as "ASC" | "DESC"
        };
    }
    throw new WebinyError(
        "Problem in determining the sorting for the entry items.",
        "SORT_EXTRACT_ERROR",
        {
            sortBy
        }
    );
};

interface IResponse {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

interface IParams {
    model: CmsModel;
    sortBy: string;
    fields: Record<string, Field>;
    sortingRegistry: FieldSortingRegistry.Interface;
}

export const extractSort = (params: IParams): IResponse => {
    const { model, sortBy, fields, sortingRegistry } = params;
    const { fieldId, isValues: isValuesSorting, order } = extractSortInfo(sortBy);

    const field = Object.values(fields).find(f => {
        const isValues = f.parents[0]?.fieldId === "values";
        if (isValues && isValuesSorting) {
            return f.fieldId === fieldId;
        }
        if (f.parents.length > 0) {
            return false;
        }
        return f.fieldId === fieldId;
    });

    const handler = sortingRegistry.find({
        model,
        field,
        fieldId,
        order,
        sortBy
    });

    if (handler) {
        return handler.createSort({
            model,
            fieldId,
            order,
            sortBy,
            field,
            fields
        });
    } else if (!field) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                fieldId,
                fields
            }
        );
    }
    const valuePath = field.createPath({
        field
    });
    return {
        field,
        fieldId,
        valuePath,
        reverse: order === "DESC"
    };
};
```

- [ ] **Step 2: Update sort to accept registry**

```typescript
// packages/api-headless-cms-storage/src/filtering/sort.ts
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import * as dotProp from "dot-prop";
import lodashSortBy from "lodash/sortBy.js";
import { extractSort } from "./fields/extractSort.js";
import type { Field } from "./fields/types.js";
import type { FieldSortingRegistry } from "../abstractions/FieldSortingRegistry.js";

interface Params<T extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    items: CmsEntry<T>[];
    sort?: string[];
    fields: Record<string, Field>;
    sortingRegistry: FieldSortingRegistry.Interface;
}

interface SortedItem {
    id: string;
    value: any;
}

export const sort = <T extends CmsEntryValues = CmsEntryValues>(
    params: Params<T>
): CmsEntry<T>[] => {
    const { model, items, sort = [], fields, sortingRegistry } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("savedOn_DESC");
    } else if (sort.length > 1) {
        throw new WebinyError(
            "Sorting is limited to a single field.",
            "SORT_MULTIPLE_FIELDS_ERROR",
            {
                sort
            }
        );
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_EMPTY_ERROR", {
            sort
        });
    }

    const { fieldId, field, valuePath, reverse } = extractSort({
        model,
        sortBy: firstSort,
        fields,
        sortingRegistry
    });

    const itemsToSort = items.map(item => {
        return {
            id: item.id,
            value: field.transform(dotProp.getProperty(item, valuePath))
        };
    });
    const sortedItems: SortedItem[] = lodashSortBy(itemsToSort, "value");
    const newItems = sortedItems.map(s => {
        const item = items.find(i => i.id === s.id);
        if (item) {
            return item;
        }
        throw new WebinyError(
            "Could not find item by given id after the sorting.",
            "SORTING_ITEMS_ERROR",
            {
                id: s.id,
                sortingBy: fieldId,
                reverse
            }
        );
    });
    if (!reverse) {
        return newItems;
    }
    return newItems.reverse();
};
```

- [ ] **Step 3: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`

- [ ] **Step 4: Run existing tests**

Run: `yarn test packages/api-headless-cms-storage 2>&1 | tail -50`
Expected: tests should still pass (existing tests don't exercise these functions directly through the new interface — they test plugin factories which remain unchanged).

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-storage/src/filtering/fields/extractSort.ts \
       packages/api-headless-cms-storage/src/filtering/sort.ts
git commit -m "refactor(api-headless-cms-storage): sort/extractSort use registry instead of PluginsContainer"
```

---

### Task 9: Handler factories + FilterRegistriesFeature + exports

**Files:**
- Create: `packages/api-headless-cms-storage/src/handlers/plainObjectPathHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/locationFolderIdPathHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/datetimeTransformHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/defaultFilterCreateHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/refFilterCreateHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/objectFilterCreateHandler.ts`
- Create: `packages/api-headless-cms-storage/src/handlers/searchableJsonFilterCreateHandler.ts`
- Create: `packages/api-headless-cms-storage/src/features/FilterRegistriesFeature.ts`
- Modify: `packages/api-headless-cms-storage/src/index.ts`
- Modify: `packages/api-headless-cms-storage/package.json` (add `@webiny/feature` dependency)

**Interfaces:**
- Consumes: All 4 abstractions (Tasks 1-4), all 4 implementations (Tasks 1-4), existing plugin logic from `src/path/`, `src/transforms/`, `src/filtering/plugins/`
- Produces: `FilterRegistriesFeature` for use by Task 10 (sql) and Task 11 (pg-os). Exports all abstractions from package index.

- [ ] **Step 1: Add `@webiny/feature` dependency**

Add `"@webiny/feature": "0.0.0"` to `packages/api-headless-cms-storage/package.json` under `dependencies`.

- [ ] **Step 2: Create plainObjectPathHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/plainObjectPathHandler.ts
import WebinyError from "@webiny/error";
import type { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";

export const createPlainObjectPathHandler = (): FieldFilterPathRegistry.Handler => {
    return {
        canUse: () => true,
        createPath: ({ field }) => {
            const { path } = field.settings || {};
            if (!path) {
                throw new WebinyError("Missing path settings value.", "FIELD_SETTINGS_ERROR", {
                    field
                });
            }
            return path;
        }
    };
};
```

- [ ] **Step 3: Create locationFolderIdPathHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/locationFolderIdPathHandler.ts
import WebinyError from "@webiny/error";
import type { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";

export const createLocationFolderIdPathHandler = (): FieldFilterPathRegistry.Handler => {
    return {
        canUse: (field, parents) => {
            if (field.fieldId !== "folderId") {
                return false;
            } else if (!parents?.length) {
                return false;
            }
            return parents[0] === "wbyAco_location";
        },
        createPath: ({ field }) => {
            const { path } = field.settings || {};
            if (!path) {
                throw new WebinyError("Missing path settings value.", "FIELD_SETTINGS_ERROR", {
                    field
                });
            }
            return path;
        }
    };
};
```

- [ ] **Step 4: Create datetimeTransformHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/datetimeTransformHandler.ts
import { parseISO } from "date-fns";
import type { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";

const transformTime = (value: any): number => {
    if (value === undefined || value === null) {
        throw new Error(`Time value is null or undefined.`);
    } else if (typeof value === "boolean" || value === "" || Array.isArray(value)) {
        throw new Error("Field value must be a string because field is defined as time.");
    }
    const converted = Number(`${value}`);
    if (typeof value === "number" || isNaN(converted) === false) {
        return Number(value);
    } else if (typeof value !== "string") {
        throw new Error("Field value must be a string because field is defined as time.");
    }
    const [time, milliseconds = 0] = value.split(".");
    const values = time.split(":").map(Number);
    if (values.length < 2) {
        throw new Error("Time must contain at least hours and minutes.");
    }
    const [hours, minutes, seconds = 0] = values;
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + Number(milliseconds);
};

const transformDateTime = (value: any): number | null => {
    if (value === null || value === undefined) {
        return null;
    } else if (typeof value === "string") {
        const parsedDateTime = parseISO(value).getTime();
        if (isNaN(parsedDateTime) === false) {
            return parsedDateTime;
        }
    } else if (
        value instanceof Date ||
        typeof (value as unknown as Date)?.getTime === "function"
    ) {
        return value.getTime();
    }
    console.warn("Could not parse given dateTime value.", "PARSE_DATE_ERROR", {
        value
    });
    return null;
};

export const createDatetimeTransformHandler = (): FieldFilterValueTransformRegistry.Handler => {
    return {
        transform: ({ field, value }) => {
            const { type } = field.settings || {};
            if (type === "time") {
                return transformTime(value);
            }
            return transformDateTime(value);
        }
    };
};
```

- [ ] **Step 5: Create defaultFilterCreateHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/defaultFilterCreateHandler.ts
import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";

export const createDefaultFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const { negate, transformValue, field, compareValue, valueFilterRegistry } = params;
            const filter = valueFilterRegistry.get(params.operation);
            if (!filter) {
                throw new WebinyError(
                    `Missing ValueFilterPlugin for operation "${params.operation}".`,
                    "MISSING_OPERATION_PLUGIN",
                    {
                        operation: params.operation
                    }
                );
            }
            return {
                negate,
                transformValue,
                field,
                compareValue,
                fieldPathId: [...field.parents.map(f => f.fieldId), field.fieldId].join("."),
                path: field.createPath({
                    field
                }),
                filter
            };
        }
    };
};
```

- [ ] **Step 6: Create refFilterCreateHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/refFilterCreateHandler.ts
import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { extractWhereParams } from "../filtering/where.js";
import { transformValue } from "../filtering/transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const createRefFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const { valueFilterRegistry, transformRegistry, field } = params;
            let value = params.value;
            if (!value) {
                value = { entryId: null };
            }
            const propertyFilters = Object.keys(value);
            if (propertyFilters.length === 0) {
                return null;
            }
            const filters: FieldFilterCreateRegistry.Result[] = [];

            for (const propertyFilter of propertyFilters) {
                const whereParams = extractWhereParams(propertyFilter);
                if (!whereParams) {
                    continue;
                }
                const { fieldId: propertyId, operation: propertyOperation, negate } = whereParams;

                const fieldType = getBaseFieldType(field);
                const transformHandler = transformRegistry.get(fieldType);

                const transformValueCallable = (value: any) => {
                    if (!transformHandler) {
                        return value;
                    }
                    return transformHandler.transform({ field, value });
                };

                const filter = valueFilterRegistry.get(propertyOperation);
                if (!filter) {
                    throw new WebinyError(
                        `Missing operation filter for "${propertyOperation}".`,
                        "MISSING_OPERATION_FILTER"
                    );
                }

                const paths = [field.createPath({ field }), propertyId];

                filters.push({
                    field,
                    path: paths.join("."),
                    fieldPathId: [...field.parents.map(f => f.fieldId), field.fieldId].join("."),
                    filter,
                    negate,
                    compareValue: transformValue({
                        value: value[propertyFilter],
                        transform: transformValueCallable
                    }),
                    transformValue: transformValueCallable
                });
            }

            return filters;
        }
    };
};
```

- [ ] **Step 7: Create objectFilterCreateHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/objectFilterCreateHandler.ts
import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { extractWhereParams } from "../filtering/where.js";
import { transformValue } from "../filtering/transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const createObjectFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const {
                value: objectValue,
                valueFilterRegistry,
                transformRegistry,
                getHandler,
                field: parentField,
                fields
            } = params;

            const filters: FieldFilterCreateRegistry.Result[] = [];

            for (const key in objectValue) {
                const value = objectValue[key];
                if (value === undefined) {
                    continue;
                }
                const whereParams = extractWhereParams(key);
                if (!whereParams) {
                    continue;
                }
                const { negate, fieldId, operation } = whereParams;

                const fieldPath = parentField.parents
                    .map(p => p.fieldId)
                    .concat([parentField.fieldId, fieldId])
                    .join(".");

                const field = fields[fieldPath];
                if (!field) {
                    throw new WebinyError(
                        `There is no field with the field path "${fieldPath}".`,
                        "FIELD_ERROR",
                        { fieldId }
                    );
                }

                const fieldType = getBaseFieldType(field);
                const handler = getHandler(fieldType);
                const transformHandler = transformRegistry.get(fieldType);

                const transformValueCallable = (value: any) => {
                    if (!transformHandler) {
                        return value;
                    }
                    return transformHandler.transform({ field, value });
                };

                const result = handler.create({
                    key,
                    value,
                    valueFilterRegistry,
                    transformRegistry,
                    getHandler,
                    operation,
                    negate,
                    field,
                    fields,
                    compareValue: transformValue({
                        value,
                        transform: transformValueCallable
                    }),
                    transformValue: transformValueCallable
                });
                if (!result) {
                    continue;
                }
                if (Array.isArray(result)) {
                    filters.push(...result);
                    continue;
                }

                filters.push(result);
            }
            return filters;
        }
    };
};
```

- [ ] **Step 8: Create searchableJsonFilterCreateHandler**

```typescript
// packages/api-headless-cms-storage/src/handlers/searchableJsonFilterCreateHandler.ts
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { extractWhereParams } from "../filtering/where.js";

function dotFlatten(obj: Record<string, any>, prefix = ""): Record<string, any> {
    return Object.entries(obj).reduce<Record<string, any>>((acc, [key, val]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === "object" && !Array.isArray(val)) {
            Object.assign(acc, dotFlatten(val, path));
        } else {
            acc[path] = val;
        }
        return acc;
    }, {});
}

export const createSearchableJsonFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const { value: objectValue, valueFilterRegistry, field: parentField } = params;

            const filters: FieldFilterCreateRegistry.Result[] = [];
            const accessPatterns = dotFlatten(objectValue);

            for (const key in accessPatterns) {
                const value = accessPatterns[key];
                if (value === undefined) {
                    continue;
                }

                const whereParams = extractWhereParams(key);
                if (!whereParams) {
                    continue;
                }
                const { negate, operation } = whereParams;

                const transformValueCallable = (value: any) => {
                    return value;
                };

                const fieldId = `${parentField.fieldId}.${whereParams.fieldId ?? key}`;

                const filter = valueFilterRegistry.get(operation);
                if (!filter) {
                    console.error(`Missing operation filter for "${operation}".`);
                    continue;
                }

                filters.push({
                    field: parentField,
                    path: `values.${fieldId}`,
                    fieldPathId: `values.${fieldId}`,
                    negate,
                    filter,
                    compareValue: value,
                    transformValue: transformValueCallable
                });
            }
            return filters;
        }
    };
};
```

- [ ] **Step 9: Create FilterRegistriesFeature**

```typescript
// packages/api-headless-cms-storage/src/features/FilterRegistriesFeature.ts
import { createFeature } from "@webiny/feature/api/index.js";
import { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";
import { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";
import { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { FieldSortingRegistry } from "../abstractions/FieldSortingRegistry.js";
import { FieldFilterPathRegistryImpl } from "../implementations/FieldFilterPathRegistryImpl.js";
import { FieldFilterValueTransformRegistryImpl } from "../implementations/FieldFilterValueTransformRegistryImpl.js";
import { FieldFilterCreateRegistryImpl } from "../implementations/FieldFilterCreateRegistryImpl.js";
import { FieldSortingRegistryImpl } from "../implementations/FieldSortingRegistryImpl.js";
import { createPlainObjectPathHandler } from "../handlers/plainObjectPathHandler.js";
import { createLocationFolderIdPathHandler } from "../handlers/locationFolderIdPathHandler.js";
import { createDatetimeTransformHandler } from "../handlers/datetimeTransformHandler.js";
import { createDefaultFilterCreateHandler } from "../handlers/defaultFilterCreateHandler.js";
import { createRefFilterCreateHandler } from "../handlers/refFilterCreateHandler.js";
import { createObjectFilterCreateHandler } from "../handlers/objectFilterCreateHandler.js";
import { createSearchableJsonFilterCreateHandler } from "../handlers/searchableJsonFilterCreateHandler.js";

export const FilterRegistriesFeature = createFeature({
    name: "cms.storage.filterRegistries",
    register: container => {
        container
            .registerFactory(FieldFilterPathRegistry, () => {
                const registry = new FieldFilterPathRegistryImpl();
                registry.register("plainObject", createPlainObjectPathHandler());
                registry.register("text", createLocationFolderIdPathHandler());
                return registry;
            })
            .inSingletonScope();

        container
            .registerFactory(FieldFilterValueTransformRegistry, () => {
                const registry = new FieldFilterValueTransformRegistryImpl();
                registry.register("datetime", createDatetimeTransformHandler());
                return registry;
            })
            .inSingletonScope();

        container
            .registerFactory(FieldFilterCreateRegistry, () => {
                const registry = new FieldFilterCreateRegistryImpl();
                registry.register("*", createDefaultFilterCreateHandler());
                registry.register("ref", createRefFilterCreateHandler());
                registry.register("object", createObjectFilterCreateHandler());
                registry.register("searchable-json", createSearchableJsonFilterCreateHandler());
                return registry;
            })
            .inSingletonScope();

        container
            .registerFactory(FieldSortingRegistry, () => {
                return new FieldSortingRegistryImpl();
            })
            .inSingletonScope();
    }
});
```

**Note:** `locationFolderIdPathHandler` is registered under `"text"` (its `fieldType` is `"text"`) and `searchableJsonFilterCreateHandler` under `"searchable-json"` — matching the original plugin `fieldType` values.

- [ ] **Step 10: Update package index exports**

Add to `packages/api-headless-cms-storage/src/index.ts`:

```typescript
/* DI registries. */
export { FieldFilterPathRegistry } from "./abstractions/FieldFilterPathRegistry.js";
export { FieldFilterValueTransformRegistry } from "./abstractions/FieldFilterValueTransformRegistry.js";
export { FieldFilterCreateRegistry } from "./abstractions/FieldFilterCreateRegistry.js";
export { FieldSortingRegistry } from "./abstractions/FieldSortingRegistry.js";
export { FilterRegistriesFeature } from "./features/FilterRegistriesFeature.js";
```

- [ ] **Step 11: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-storage 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 12: Run existing tests**

Run: `yarn test packages/api-headless-cms-storage 2>&1 | tail -50`
Expected: all pass (existing tests exercise plugin factories directly, not through the new registries)

- [ ] **Step 13: Commit**

```bash
git add packages/api-headless-cms-storage/src/handlers/ \
       packages/api-headless-cms-storage/src/features/FilterRegistriesFeature.ts \
       packages/api-headless-cms-storage/src/index.ts \
       packages/api-headless-cms-storage/package.json
git commit -m "feat(api-headless-cms-storage): add handler factories, FilterRegistriesFeature, and exports"
```

---

### Task 10: Refactor api-headless-cms-sql — remove plugins threading

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`
- Modify: `packages/api-headless-cms-sql/src/index.ts`
- Modify: `packages/api-headless-cms-sql/src/types.ts`

**Interfaces:**
- Consumes: `FilterRegistriesFeature` (Task 9), `FieldFilterPathRegistry`, `FieldFilterValueTransformRegistry`, `FieldFilterCreateRegistry`, `FieldSortingRegistry` (Tasks 1-4), updated `createFields`, `filter`, `sort` (Tasks 5-8)
- Produces: Updated `createEntriesStorageOperations` that resolves registries from container. Updated `createSqlStorageOperations` that registers `FilterRegistriesFeature` and no longer passes `plugins`. Updated `SqlStorageOperationsFactoryParams` without `plugins`.

- [ ] **Step 1: Remove `plugins` from `types.ts`**

```typescript
// packages/api-headless-cms-sql/src/types.ts
import type {
    CmsContext,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";

export type { CmsContext };

export interface SqlStorageOperationsFactoryParams {
    container: CmsContext["container"];
}

export interface SqlStorageOperationsFactory {
    (params: SqlStorageOperationsFactoryParams): BaseHeadlessCmsStorageOperations;
}
```

- [ ] **Step 2: Update `operations/entry/index.ts`**

Remove `plugins` from params. Resolve registries from container. Pass registries to `createFields`, `filter`, `sort`.

```typescript
// packages/api-headless-cms-sql/src/operations/entry/index.ts
import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { CmsContext } from "~/types.js";
import type { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow, rowToEntry, mergeEntryLevelMeta } from "./mappers.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    filter,
    sort,
    createStorageModelAccessor,
    createStorageTransformCallable,
    aggregateUniqueFieldValues
} from "@webiny/api-headless-cms-storage";
import { KnexClient } from "@webiny/api-core-sql";
import {
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";

interface CreateEntriesStorageOperationsParams {
    knex: KnexClient.Interface;
    entryTableManager: EntryTableManager.Interface;
    container: CmsContext["container"];
}

// ... rest of file identical except:
// 1. Remove `plugins` from destructuring at top of createEntriesStorageOperations
// 2. In listEntries, resolve registries from container and pass to createFields/filter/sort
```

The key change in `listEntries`:

```typescript
const listEntries = async <T extends CmsEntryValues = CmsEntryValues>(
    initialModel: CmsModel,
    params: { /* same */ }
) => {
    await entryTableManager.ensureTable();

    const model = getStorageOperationsModel(initialModel);
    // ... same destructuring ...

    // ... same query building ...

    const pathRegistry = container.resolve(FieldFilterPathRegistry);
    const transformRegistry = container.resolve(FieldFilterValueTransformRegistry);
    const filterCreateRegistry = container.resolve(FieldFilterCreateRegistry);
    const sortingRegistry = container.resolve(FieldSortingRegistry);

    const modelFields = createFields({
        pathRegistry,
        transformRegistry,
        fields: model.fields
    });

    const valueFilterRegistry = container.resolve(ValueFilterRegistry);

    const filteredItems = filter<T>({
        items: records,
        where,
        filterCreateRegistry,
        transformRegistry,
        fields: modelFields,
        fullTextSearch: {
            term: search,
            fields: searchFields || []
        },
        valueFilterRegistry
    });

    // ... totalCount ...

    const sortedItems = sort<T>({
        model,
        items: filteredItems,
        sort: sortBy,
        fields: modelFields,
        sortingRegistry
    });

    // ... rest unchanged ...
};
```

- [ ] **Step 3: Update `index.ts`**

Replace `plugins.register([...])` with `FilterRegistriesFeature.register(container)`. Remove `plugins` from params and factory.

```typescript
// In createSqlStorageOperations:
const createSqlStorageOperations: SqlStorageOperationsFactory = params => {
    const { container } = params;

    const knex = container.resolve(KnexClient);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entryTableManager = container.resolve(EntryTableManager);

    const groups = createGroupsStorageOperations(knex, tableNameResolver, groupSchemaManager);
    const models = createModelsStorageOperations(knex, tableNameResolver, modelSchemaManager);
    const entries = createEntriesStorageOperations({
        knex,
        entryTableManager,
        container
    });

    return {
        name: "sql",
        beforeInit: () => {},
        groups,
        models,
        entries
    };
};

// In SqlStorageOperationsFactoryImpl:
class SqlStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public create(context: CmsContext) {
        return createSqlStorageOperations({
            container: context.container
        });
    }
}

// In registerSqlStorageOperations feature registration:
// Add FilterRegistriesFeature.register(container) alongside existing feature registrations
```

Remove these imports from `index.ts`:
- `createFilterCreatePlugins`
- `createPlainObjectPathPlugin`
- `createLocationFolderIdPathPlugin`
- `createDatetimeTransformValuePlugin`

Add import:
- `FilterRegistriesFeature` from `@webiny/api-headless-cms-storage`

- [ ] **Step 4: Build to verify compilation**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/index.ts \
       packages/api-headless-cms-sql/src/index.ts \
       packages/api-headless-cms-sql/src/types.ts
git commit -m "refactor(api-headless-cms-sql): resolve filter registries from container, remove plugins threading"
```

---

### Task 11: Refactor api-headless-cms-pg-os — remove plugins threading

**Files:**
- Modify: `packages/api-headless-cms-pg-os/src/operations/entry/index.ts`
- Modify: `packages/api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts`

**Interfaces:**
- Consumes: `FilterRegistriesFeature` (Task 9), updated `createEntriesStorageOperations` from sql (Task 10)
- Produces: Updated pg-os entry operations without `plugins` param. Updated `HeadlessCmsPgOsFeature` that registers `FilterRegistriesFeature` instead of `plugins.register()`.

- [ ] **Step 1: Update `operations/entry/index.ts`**

Remove `plugins` from `CreateEntriesStorageOperationsParams` and the call to `createSqlEntriesStorageOperations`.

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/index.ts
import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { createEntryWriteOperations } from "./EntryWriteOperations.js";
import { createEntrySearchOperations } from "./EntrySearchOperations.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    elasticsearch: OpenSearchClient;
    entryTableManager: EntryTableManager.Interface;
    syncTableManager: SyncTableManager.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const {
        knex,
        container,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        compressionHandler
    } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex: { client: knex },
        entryTableManager,
        container
    });

    const writeOps = createEntryWriteOperations({
        knex,
        container,
        sqlOps,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    const searchOps = createEntrySearchOperations({
        container,
        elasticsearch,
        fieldRegistry,
        fieldIndexRegistry
    });

    return {
        ...writeOps,
        ...searchOps,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision
    };
};
```

- [ ] **Step 2: Update HeadlessCmsPgOsFeature.ts**

Remove `plugins.register([...])` block. Remove `plugins` from `PgOsStorageOperationsFactoryParams` and from `createPgOsStorageOperations`. Add `FilterRegistriesFeature.register(container)` to the feature registration. Remove `plugins` from `createEntriesStorageOperations` call.

Key changes:

```typescript
// Remove from PgOsStorageOperationsFactoryParams:
//   plugins: any;

// In createPgOsStorageOperations, remove:
//   const { elasticsearch, container, plugins } = params;
// Replace with:
//   const { elasticsearch, container } = params;

// Remove the plugins.register([...]) block (lines 65-70)

// In entries call, remove plugins:
const entries = createEntriesStorageOperations({
    knex: knex.client,
    container,
    elasticsearch,
    entryTableManager,
    syncTableManager,
    fieldRegistry,
    fieldIndexRegistry,
    compressionHandler
});

// In PgOsStorageOperationsFactoryImpl.create():
public create(context: CmsContext) {
    return createPgOsStorageOperations({
        elasticsearch: this.openSearchClient.use(),
        container: context.container
    });
}

// In registerPgOsStorageOperations, add to register callback:
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
// Add after other feature registrations:
FilterRegistriesFeature.register(container);
```

- [ ] **Step 3: Build all 3 packages**

Run: `yarn build -p @webiny/api-headless-cms-storage -p @webiny/api-headless-cms-sql -p @webiny/api-headless-cms-pg-os 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 4: Run pre-commit checks**

Run: `yarn lint 2>&1 | tail -30`
Run: `yarn format > /dev/null 2>&1`

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/index.ts \
       packages/api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts
git commit -m "refactor(api-headless-cms-pg-os): resolve filter registries from container, remove plugins threading"
```

---

### Task 12: Final verification — full build + test

**Files:** None (verification only)

**Interfaces:**
- Consumes: All changes from Tasks 1-11

- [ ] **Step 1: Run yarn to update lockfile**

Run: `yarn > /dev/null 2>&1`

- [ ] **Step 2: Update tsconfig files**

Run: `node scripts/generateTsConfigsInPackages.js`

- [ ] **Step 3: Check dependency sync**

Run: `yarn adio`
Run: `yarn webiny sync-dependencies`

- [ ] **Step 4: Format**

Run: `yarn format > /dev/null 2>&1`

- [ ] **Step 5: Lint**

Run: `yarn lint 2>&1 | tail -30`
Expected: no errors

- [ ] **Step 6: Build all 3 packages**

Run: `yarn build -p @webiny/api-headless-cms-storage -p @webiny/api-headless-cms-sql -p @webiny/api-headless-cms-pg-os 2>&1 | tail -30`
Expected: successful build

- [ ] **Step 7: Run api-headless-cms-storage tests**

Run: `yarn test packages/api-headless-cms-storage 2>&1 | tail -50`
Expected: all pass

- [ ] **Step 8: Commit any formatting/config changes**

```bash
git add .
git commit -m "chore: formatting and config sync after filter registries DI refactor"
```
