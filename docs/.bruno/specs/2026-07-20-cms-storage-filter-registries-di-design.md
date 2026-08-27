# CMS Storage Filter Registries — DI Design

**Date:** 2026-07-20
**Scope:** `api-headless-cms-storage`, `api-headless-cms-sql`, `api-headless-cms-pg-os`
**Goal:** Replace `PluginsContainer` threading with DI-resolvable registries for the 4 plugin types used in entry filtering/sorting.

## Background

Entry listing in `api-headless-cms-sql` uses 4 plugin types from `api-headless-cms-storage`, all looked up via `PluginsContainer.byType()`:

| Plugin class | Type string | Keyed by | Consumer |
|---|---|---|---|
| `CmsEntryFieldFilterPathPlugin` | `cms-field-filter-path` | `fieldType` | `createFields()` |
| `CmsFieldFilterValueTransformPlugin` | `cms-field-filter-value-transform` | `fieldType` | `createFields()`, `createExpressions()` |
| `CmsEntryFieldFilterPlugin` | `cms.dynamodb.entry.field.filter` | `fieldType` | `createExpressions()` |
| `CmsEntryFieldSortingPlugin` | `cms.entry.field.sorting` | list (not keyed) | `extractSort()` |

These plugins are registered on `context.plugins` (legacy `PluginsContainer`) and threaded through:
```
HeadlessCmsPgOsFeature → createEntriesStorageOperations (pg-os) → createSqlEntriesStorageOperations (sql) → listEntries → createFields/filter/sort
```

Both `api-headless-cms-sql/src/index.ts` and `api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts` register identical plugins.

## Design

### New Abstractions

4 DI abstractions in `api-headless-cms-storage/src/abstractions/`, each following the `createAbstraction()` + namespace pattern:

#### FieldFilterPathRegistry

```typescript
// abstractions/FieldFilterPathRegistry.ts
interface IFieldFilterPathHandler {
    canUse(field: Pick<CmsModelField, "fieldId" | "type">, parents: string[]): boolean;
    createPath(params: CreatePathCallableParams): string;
}

interface IFieldFilterPathRegistry {
    register(fieldType: string, handler: IFieldFilterPathHandler): void;
    get(fieldType: string): IFieldFilterPathHandler | undefined;
}

export const FieldFilterPathRegistry = createAbstraction<IFieldFilterPathRegistry>(
    "Cms/Storage/FieldFilterPathRegistry"
);

export namespace FieldFilterPathRegistry {
    export type Interface = IFieldFilterPathRegistry;
    export type Handler = IFieldFilterPathHandler;
}
```

#### FieldFilterValueTransformRegistry

```typescript
// abstractions/FieldFilterValueTransformRegistry.ts
interface IFieldFilterValueTransformHandler {
    transform(params: CmsFieldFilterValueTransformParams): any;
}

interface IFieldFilterValueTransformRegistry {
    register(fieldType: string, handler: IFieldFilterValueTransformHandler): void;
    get(fieldType: string): IFieldFilterValueTransformHandler | undefined;
}

export const FieldFilterValueTransformRegistry = createAbstraction<IFieldFilterValueTransformRegistry>(
    "Cms/Storage/FieldFilterValueTransformRegistry"
);

export namespace FieldFilterValueTransformRegistry {
    export type Interface = IFieldFilterValueTransformRegistry;
    export type Handler = IFieldFilterValueTransformHandler;
}
```

#### FieldFilterCreateRegistry

```typescript
// abstractions/FieldFilterCreateRegistry.ts
interface IFieldFilterCreateHandler {
    create(params: FieldFilterCreateParams): FilterCreateResult;
}

interface IFieldFilterCreateRegistry {
    register(fieldType: string, handler: IFieldFilterCreateHandler): void;
    get(fieldType: string): IFieldFilterCreateHandler | undefined;
    getDefault(): IFieldFilterCreateHandler;
}

export const FieldFilterCreateRegistry = createAbstraction<IFieldFilterCreateRegistry>(
    "Cms/Storage/FieldFilterCreateRegistry"
);

export namespace FieldFilterCreateRegistry {
    export type Interface = IFieldFilterCreateRegistry;
    export type Handler = IFieldFilterCreateHandler;
}
```

`getDefault()` returns the `"*"` entry (currently `defaultFilterCreate`).

**Note on recursive lookup:** `objectFilterCreate` calls `getFilterCreatePlugin(fieldType)` to delegate to other handlers (e.g. default) for nested object fields. The `FieldFilterCreateHandler.create()` params must include a `getHandler(fieldType)` callback (provided by `createExpressions`) and the `FieldFilterValueTransformRegistry` so nested handlers can transform values. This mirrors the current `getFilterCreatePlugin` + `transformValuePlugins` params.

#### FieldSortingRegistry

```typescript
// abstractions/FieldSortingRegistry.ts
interface IFieldSortingHandler {
    canUse(params: SortingCanUseParams): boolean;
    createSort(params: SortingCreateParams): SortingResult;
}

interface IFieldSortingRegistry {
    register(handler: IFieldSortingHandler): void;
    find(params: SortingCanUseParams): IFieldSortingHandler | undefined;
}

export const FieldSortingRegistry = createAbstraction<IFieldSortingRegistry>(
    "Cms/Storage/FieldSortingRegistry"
);

export namespace FieldSortingRegistry {
    export type Interface = IFieldSortingRegistry;
    export type Handler = IFieldSortingHandler;
}
```

Not keyed by fieldType. `find()` iterates in reverse (last-registered wins), matching current `plugins.byType().reverse().find()`.

### Implementations

Simple Map/Array-backed classes in `api-headless-cms-storage/src/implementations/`:

- `FieldFilterPathRegistryImpl` — `Map<string, Handler>`, `register()`, `get()`
- `FieldFilterValueTransformRegistryImpl` — same shape
- `FieldFilterCreateRegistryImpl` — same shape + `getDefault()` returns `"*"` entry
- `FieldSortingRegistryImpl` — array of handlers, `register()`, `find()` with reverse iteration

### Handler Factories

New handler factory functions in `api-headless-cms-storage/src/handlers/` extract logic from existing plugin factories, returning the `Handler` interface without `Plugin` class overhead:

- `createPlainObjectPathHandler()` — from `createPlainObjectPathPlugin()`
- `createLocationFolderIdPathHandler()` — from `createLocationFolderIdPathPlugin()`
- `createDatetimeTransformHandler()` — from `createDatetimeTransformValuePlugin()`
- `createDefaultFilterCreateHandler()` — from `createDefaultFilterCreate()`
- `createRefFilterCreateHandler()` — from `createRefFilterCreate()`
- `createObjectFilterCreateHandler()` — from `objectFilterCreate()`
- `createSearchableJsonFilterCreateHandler()` — from `searchableJsonFilterCreate()`

### Feature Registration

New `FilterRegistriesFeature` in `api-headless-cms-storage/src/features/FilterRegistriesFeature.ts`:

```typescript
export const FilterRegistriesFeature = createFeature({
    name: "cms.storage.filterRegistries",
    register: container => {
        container.registerFactory(FieldFilterPathRegistry, () => {
            const registry = new FieldFilterPathRegistryImpl();
            registry.register("plainObject", createPlainObjectPathHandler());
            registry.register("text", createLocationFolderIdPathHandler());
            return registry;
        }).inSingletonScope();

        container.registerFactory(FieldFilterValueTransformRegistry, () => {
            const registry = new FieldFilterValueTransformRegistryImpl();
            registry.register("datetime", createDatetimeTransformHandler());
            return registry;
        }).inSingletonScope();

        container.registerFactory(FieldFilterCreateRegistry, () => {
            const registry = new FieldFilterCreateRegistryImpl();
            registry.register("*", createDefaultFilterCreateHandler());
            registry.register("ref", createRefFilterCreateHandler());
            registry.register("object", createObjectFilterCreateHandler());
            registry.register("searchableJson", createSearchableJsonFilterCreateHandler());
            return registry;
        }).inSingletonScope();

        container.registerFactory(FieldSortingRegistry, () => {
            return new FieldSortingRegistryImpl();
        }).inSingletonScope();
    }
});
```

### Where Features Get Registered

- **`api-headless-cms-sql/src/index.ts`:** Replace `plugins.register([createFilterCreatePlugins(), ...])` with `FilterRegistriesFeature.register(container)`.
- **`api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts`:** Replace `plugins.register([...])` with `FilterRegistriesFeature.register(container)`. Idempotent due to singleton scope.

### Consumer Refactor

Functions in `api-headless-cms-storage` stop accepting `plugins: PluginsContainer`:

| Function | Old params | New params |
|---|---|---|
| `createFields()` | `plugins` | `pathRegistry`, `transformRegistry` |
| `createExpressions()` | `plugins` | `filterCreateRegistry`, `transformRegistry` |
| `filter()` | `plugins` | `filterCreateRegistry`, `transformRegistry` |
| `sort()` / `extractSort()` | `plugins` | `sortingRegistry` |

`getMappedPlugins()` stays for ddb/ddb-es backward compat.

### Param Chain Removal

Remove `plugins: PluginsContainer` from:

- `CreateEntriesStorageOperationsParams` in `api-headless-cms-sql/src/operations/entry/index.ts`
- `CreateEntriesStorageOperationsParams` in `api-headless-cms-pg-os/src/operations/entry/index.ts`
- `SqlStorageOperationsFactoryParams` in `api-headless-cms-sql/src/types.ts`
- `PgOsStorageOperationsFactoryParams` in `api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts`
- `createSqlStorageOperations` / `SqlStorageOperationsFactoryImpl.create()`
- `createPgOsStorageOperations` / `PgOsStorageOperationsFactoryImpl.create()`

`listEntries()` in `cms-sql/entry/index.ts` resolves all 4 registries from container and passes them to `createFields`, `filter`, `sort`.

### What Stays Unchanged

- Plugin classes (`CmsEntryFieldFilterPathPlugin`, `CmsFieldFilterValueTransformPlugin`, `CmsEntryFieldFilterPlugin`, `CmsEntryFieldSortingPlugin`) — ddb/ddb-es still use them
- `getMappedPlugins()` — ddb/ddb-es still use it
- Plugin factory functions (`createFilterCreatePlugins()`, `createPlainObjectPathPlugin()`, etc.) — ddb/ddb-es still call them
- `PluginsContainer` class — unchanged

### File Summary

**New files in `api-headless-cms-storage`:**
- `src/abstractions/FieldFilterPathRegistry.ts`
- `src/abstractions/FieldFilterValueTransformRegistry.ts`
- `src/abstractions/FieldFilterCreateRegistry.ts`
- `src/abstractions/FieldSortingRegistry.ts`
- `src/implementations/FieldFilterPathRegistryImpl.ts`
- `src/implementations/FieldFilterValueTransformRegistryImpl.ts`
- `src/implementations/FieldFilterCreateRegistryImpl.ts`
- `src/implementations/FieldSortingRegistryImpl.ts`
- `src/features/FilterRegistriesFeature.ts`
- `src/handlers/plainObjectPathHandler.ts`
- `src/handlers/locationFolderIdPathHandler.ts`
- `src/handlers/datetimeTransformHandler.ts`
- `src/handlers/defaultFilterCreateHandler.ts`
- `src/handlers/refFilterCreateHandler.ts`
- `src/handlers/objectFilterCreateHandler.ts`
- `src/handlers/searchableJsonFilterCreateHandler.ts`

**Modified files:**
- `api-headless-cms-storage/src/filtering/fields/createFields.ts` — use registries
- `api-headless-cms-storage/src/filtering/expressions/createExpressions.ts` — use registries
- `api-headless-cms-storage/src/filtering/filter.ts` — use registries, drop plugins param
- `api-headless-cms-storage/src/filtering/sort.ts` — use registry
- `api-headless-cms-storage/src/filtering/fields/extractSort.ts` — use registry
- `api-headless-cms-storage/src/index.ts` — export new abstractions
- `api-headless-cms-sql/src/operations/entry/index.ts` — resolve from container, drop plugins
- `api-headless-cms-sql/src/index.ts` — register feature, drop plugins.register()
- `api-headless-cms-sql/src/types.ts` — remove plugins from params
- `api-headless-cms-pg-os/src/operations/entry/index.ts` — drop plugins param
- `api-headless-cms-pg-os/src/features/HeadlessCmsPgOsFeature.ts` — register feature, drop plugins.register()
