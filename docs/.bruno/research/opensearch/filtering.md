# filtering — DI Analysis

## Current State

### Module Structure

The filtering module in `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/filtering/` comprises 5 files with clear separation of concerns:

1. **`exec.ts`** — Orchestrates entire filtering pipeline
   - Exports: `createExecFiltering()` → returns main executor function
   - Dependencies: Uses all other modules + registries
   - Signature: Accepts `CreateExecParams` (model, fields, registries)
   - Returns recursive filtering executor that processes `CmsEntryListWhere` objects

2. **`applyFiltering.ts`** — Applies single filter operation
   - Exports: `createApplyFiltering()` → returns executor for one filter
   - Dependencies: `createFieldPathFactory`, registries, utilities
   - Processes: Transforms values, determines field paths, calls operator plugins
   - Signature: Returns `CmsEntryOpenSearchFilter.ApplyFiltering` (matches existing feature type)

3. **`path.ts`** — Field path computation
   - Exports: `createFieldPathFactory()` → returns path builder
   - Dependencies: `CmsEntryOpenSearchValueSearchRegistry.Interface`
   - Behavior: Delegates to value search registry for custom paths, falls back to storage ID
   - Pure factory pattern — no side effects

4. **`populated.ts`** — Query object cleanup
   - Exports: `getPopulated()` → utility function
   - Dependencies: None (pure utility)
   - Behavior: Filters undefined/empty arrays from OpenSearch bool query
   - Used by: `exec.ts` to clean recursive query results

5. **`values.ts`** — AND/OR condition validation
   - Exports: `getWhereValues()` → validator function
   - Dependencies: None (pure utility)
   - Behavior: Validates array format for AND/OR conditions, throws on malformed input
   - Used by: `exec.ts` for each AND/OR block

## Dependencies

### External Registries (Already DI-managed)

- `OpenSearchQueryBuilderOperatorRegistry.Interface` — operator plugins (created via `createOperatorPluginList`)
- `CmsEntryOpenSearchValueSearchRegistry.Interface` — field-type-specific value path builders
- `CmsEntryOpenSearchFilterRegistry.Interface` — field-type-specific filter executors

### Internal Cross-module Dependencies

```
exec.ts
  ↓ (creates)
applyFiltering.ts ← path.ts
  ↓                    ↑
  uses                uses
    ↓
CmsEntryOpenSearchValueSearchRegistry
```

- `exec.ts` → `applyFiltering.ts` (direct factory call in line 41)
- `exec.ts` → `values.ts` (direct function call, line 63, 75)
- `exec.ts` → `populated.ts` (direct function call, line 68, 80)
- `applyFiltering.ts` → `path.ts` (direct factory call, line 18)
- `path.ts` → `CmsEntryOpenSearchValueSearchRegistry` (registry lookup, line 18)

### Non-DI External Dependencies

- `transformValueForSearch()` from utils (line 2 in applyFiltering.ts)
- `hasKeyword()` from utils (line 3 in applyFiltering.ts)
- `createBaseQuery()` from initialQuery.ts (line 10 in exec.ts)
- `parseWhereKey()` from OpenSearch lib (line 11 in exec.ts)
- `assignMinimumShouldMatchToQuery()` from utils (line 15 in exec.ts)

## Callers

### Direct Imports (outside filtering/)

**`body.ts`** (entry point for query building)
```typescript
import { createExecFiltering } from "./filtering/index.js";

const execFiltering = createExecFiltering({
    model,
    fields: modelFields,
    operatorRegistry,
    valueSearchRegistry,
    filterRegistry
});

execFiltering({ where, query });  // line 115-126
```

**`sort.ts`** (sorting field path computation)
```typescript
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path.js";

const createFieldPath = createFieldPathFactory({
    valueSearchRegistry
});

// Used in reduce loop to compute sort field paths (line 62-88)
```

### Index Export Chain

```
filtering/index.ts → exports createExecFiltering
  ↑
body.ts imports from filtering/index.js
```

### Test Files (DDB-ES package)

Many tests in `packages/api-headless-cms-ddb-es/__tests__/filtering/` reference filtering internals, but these are legacy tests for a different package variant — not direct callers of this module.

## DI Recommendation

### **YES — Convert to DI Features**

**Rationale:**

1. **Already has registry pattern dependencies** — `exec.ts` accepts `CmsEntryOpenSearchFilterRegistry.Interface` and `CmsEntryOpenSearchValueSearchRegistry.Interface` as injected parameters. Partial DI already exists.

2. **Factory pattern is present** — All exports are factory functions (`createExecFiltering`, `createApplyFiltering`, `createFieldPathFactory`), which is the idiomatic DI style in this codebase.

3. **Limited callers** — Only 2 direct callers (`body.ts`, `sort.ts`), both in same package, making refactor scope manageable.

4. **Consistent with package patterns** — `CmsEntryOpenSearchFilter`, `CmsEntryOpenSearchValueSearch`, etc. follow this exact pattern. Filtering should match.

5. **Encapsulates implementation details** — Moving `populated.ts` and `values.ts` into DI prevents accidental direct imports of internal utilities.

6. **Dependency clarity** — Registry approach makes it explicit what each function needs; difficult to accidentally use wrong registry instance.

7. **Testability** — Features can be registered with mock registries; current factory approach requires manual parameter passing in tests.

### Concerns/Constraints

- **`populated.ts` and `values.ts` are pure utilities** — Could remain as-is or wrap in feature. Wrapping adds minimal overhead but improves discoverability.
- **`sort.ts` dependency on `createFieldPathFactory`** — Would need to accept factory as injected dependency or access via service container.
- **Backward compatibility** — Current callers (`body.ts`, `sort.ts`) would need refactoring to use container resolution instead of direct imports.

## If YES — Proposed Design

### Feature Structure

```
src/features/CmsEntryOpenSearchFiltering/
├── abstractions/
│   ├── CmsEntryOpenSearchExecFiltering.ts        (main executor)
│   ├── CmsEntryOpenSearchApplyFiltering.ts       (single filter applier)
│   ├── CmsEntryOpenSearchFieldPathFactory.ts     (path builder)
│   └── CmsEntryOpenSearchFilteringUtils.ts       (populated, values helpers)
├── CmsEntryOpenSearchExecFiltering.ts            (impl + DI registration)
├── CmsEntryOpenSearchApplyFiltering.ts           (impl + DI registration)
├── CmsEntryOpenSearchFieldPathFactory.ts         (impl + DI registration)
├── CmsEntryOpenSearchFilteringUtils.ts           (impl + DI registration)
├── feature.ts                                     (feature definition)
└── index.ts                                       (public exports)
```

### Abstraction Definitions

#### `CmsEntryOpenSearchExecFiltering` (main)

```typescript
interface IExecParams {
    where: CmsEntryListWhere;
    query: OpenSearchBoolQueryConfig;
    isValues?: boolean;
}

interface ICmsEntryOpenSearchExecFiltering {
    execute(params: IExecParams): void;
}

export const CmsEntryOpenSearchExecFiltering = 
    createAbstraction<ICmsEntryOpenSearchExecFiltering>(
        "Cms/Entry/OpenSearch/ExecFiltering"
    );
```

#### `CmsEntryOpenSearchApplyFiltering` (single filter executor)

```typescript
interface IApplyFilteringParams {
    key: string;
    value: any;
    query: OpenSearchBoolQueryConfig;
    operator: string;
    field: ModelField;
}

interface ICmsEntryOpenSearchApplyFiltering {
    apply(params: IApplyFilteringParams): void;
}

export const CmsEntryOpenSearchApplyFiltering = 
    createAbstraction<ICmsEntryOpenSearchApplyFiltering>(
        "Cms/Entry/OpenSearch/ApplyFiltering"
    );
```

#### `CmsEntryOpenSearchFieldPathFactory` (path computation)

```typescript
interface IFieldPathParams {
    field: ModelField;
    key: string;
    value: any;
    originalValue: any;
    keyword: boolean;
}

interface IFieldPathResult {
    basePath: string;
    path: string;
}

interface ICmsEntryOpenSearchFieldPathFactory {
    createFieldPath(params: IFieldPathParams): IFieldPathResult;
}

export const CmsEntryOpenSearchFieldPathFactory = 
    createAbstraction<ICmsEntryOpenSearchFieldPathFactory>(
        "Cms/Entry/OpenSearch/FieldPathFactory"
    );
```

#### `CmsEntryOpenSearchFilteringUtils` (optional, pure utilities)

```typescript
interface ICmsEntryOpenSearchFilteringUtils {
    getPopulated(
        query: OpenSearchBoolQueryConfig
    ): Partial<OpenSearchBoolQueryConfig>;
    
    getWhereValues(
        value: unknown,
        condition: "AND" | "OR"
    ): CmsEntryListWhere[];
}

export const CmsEntryOpenSearchFilteringUtils = 
    createAbstraction<ICmsEntryOpenSearchFilteringUtils>(
        "Cms/Entry/OpenSearch/FilteringUtils"
    );
```

### Implementation Registration

In `feature.ts`:

```typescript
export const CmsEntryOpenSearchFilteringFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FilteringFeature",
    register: container => {
        container.register(CmsEntryOpenSearchFieldPathFactory);
        container.register(CmsEntryOpenSearchApplyFiltering);
        container.register(CmsEntryOpenSearchExecFiltering);
        container.register(CmsEntryOpenSearchFilteringUtils);
    }
});
```

### Consumer Refactor Pattern (body.ts → with DI)

**Before:**
```typescript
const execFiltering = createExecFiltering({
    model, fields: modelFields, operatorRegistry, 
    valueSearchRegistry, filterRegistry
});
execFiltering({ where, query });
```

**After:**
```typescript
// In container-aware context:
const execFiltering = container.get(CmsEntryOpenSearchExecFiltering);
execFiltering.execute({ where, query });
```

Or with factory injection for backward compat:
```typescript
class ElasticsearchBodyFactory {
    constructor(
        private readonly execFilteingFactory: CmsEntryOpenSearchExecFiltering.Factory
    ) {}
    
    createBody(params: ICreateElasticsearchBodyParams): SearchBody {
        const execFiltering = this.execFilteringFactory.create({
            model, fields, registries...
        });
        // ...
    }
}
```

### sort.ts Refactor Pattern

**Before:**
```typescript
const createFieldPath = createFieldPathFactory({ valueSearchRegistry });
```

**After:**
```typescript
// Option A: inject factory itself
class ElasticsearchSortFactory {
    constructor(
        private readonly fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Factory
    ) {}
}

// Option B: inject builder instance (simpler)
class ElasticsearchSortFactory {
    constructor(
        private readonly fieldPath: CmsEntryOpenSearchFieldPathFactory.Interface
    ) {}
    // fieldPath.createFieldPath(...) is called directly
}
```

### Benefits of Proposed Design

✓ Consistent with existing feature patterns in package  
✓ Clear abstraction boundaries  
✓ Registryable for testing/mocking  
✓ Eliminates internal utility leakage (`populated`, `values`)  
✓ Makes dependency requirements explicit  
✓ Enables plugin-based filter strategy overrides in future  

### Migration Path

1. Create feature directory and abstraction interfaces
2. Update implementations to match interfaces
3. Register in feature
4. Update `body.ts` to use container-resolved `ExecFiltering`
5. Update `sort.ts` to use container-resolved `FieldPathFactory`
6. Delete old filtering directory (or move to deprecated)
7. Update `filtering/index.ts` to export from feature namespace

---

## Summary

**Current state:** Functional but not DI-managed; isolated utility functions + factory pattern.  
**Candidacy:** **Strong YES** — Already uses registry pattern, has factory signatures, and matches package conventions.  
**Effort:** Low-to-moderate; 2 callers, straightforward interface extraction, feature registration template exists.  
**Benefit:** Improved testability, consistency, discoverability, and future extensibility (plugin filters).
