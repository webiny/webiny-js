# body.ts — DI Analysis

## Current State

**File**: `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/body.ts`

**Exports**: Single function `createElasticsearchBody`

**Purpose**: Constructs an OpenSearch `SearchBody` query object for CMS entry list operations. Orchestrates field modeling, filtering, sorting, full-text search, and extensibility via modifiers.

**Interface**: 
```typescript
export const createElasticsearchBody = ({
    operatorRegistry,
    model,
    params,
    fieldRegistry,
    fieldIndexRegistry,
    bodyModifiers,
    sortModifiers,
    queryModifiers,
    valueSearchRegistry,
    fullTextSearches,
    filterRegistry,
    fieldFactory
}: ICreateElasticsearchBodyParams): SearchBody
```

## Dependencies

### Incoming
Callers must inject **12 parameters** (all abstractions):
- `operatorRegistry: OpenSearchQueryBuilderOperatorRegistry.Interface`
- `fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface`
- `fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface`
- `bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[]`
- `sortModifiers: CmsEntryOpenSearchSortModifier.Interface[]`
- `queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[]`
- `valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface`
- `fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[]`
- `filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface`
- `fieldFactory: OpenSearchFieldFactory.Interface`
- `model: CmsModel`
- `params: CmsEntryListParams` (runtime data)

### Local imports
Functions used internally (testable via integration):
- `createModelFields()`
- `createFullTextSearchFields()`
- `createInitialQuery()`
- `applyFullTextSearch()`
- `createExecFiltering()`
- `createElasticsearchSort()`
- `assignMinimumShouldMatchToQuery()`

## Callers

**Only 4 call sites across 2 packages** — highly concentrated usage:

| File | Line | Context | Pattern |
|------|------|---------|---------|
| `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts` | 1364 | `list()` operation | Passes all 12+ params |
| `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts` | 2081 | `getUniqueFieldValues()` | Passes all 12+ params |
| `packages/api-headless-cms-pg-os/src/operations/entry/index.ts` | 325 | `list()` operation | Passes all 12+ params |
| `packages/api-headless-cms-pg-os/src/operations/entry/index.ts` | 404 | `getUniqueFieldValues()` | Passes all 12+ params |

**Observation**: Both callers (ddb-es and pg-os) invoke with **identical parameter patterns**—they receive the same dependencies at module init and pass them through identically.

## DI Recommendation

**YES — Strong Candidate**

### Reasoning

1. **Parameter Bloat**: Callers currently handle 12+ parameters. A single abstraction would reduce this to ~3 parameters (abstraction, model, params).

2. **Testability**: All dependencies are already mocks in tests. DI container would make that explicit and testable:
   - Swap operator registries for test variants
   - Mock modifiers without touching function signature
   - Test body building in isolation without rebuild utilities

3. **Code Duplication**: Two packages (ddb-es, pg-os) replicate identical parameter-passing logic. DI centralizes this once.

4. **Consistency**: Both packages' `list()` and `getUniqueFieldValues()` operations call with identical signatures—this enforces a stable contract.

5. **Extensibility**: New body-building strategies (e.g., `FacetBodyBuilder`, `AggregationBodyBuilder`) could swap implementations without callers changing.

6. **Precedent**: Package already uses DI features for similar concerns:
   - `CmsEntryOpenSearchIndexCreate` (abstraction + implementation pattern)
   - `CmsEntryOpenSearchBodyModifier` (registry pattern)
   - All downstream modifiers are already abstract

## If YES — Proposed Design

### Abstraction

**File**: `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyBuilder/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    CmsEntryListParams,
    CmsEntryListWhere
} from "@webiny/api-headless-cms/types/index.js";
import type { SearchBody, PrimitiveValue } from "@webiny/api-opensearch";

export interface ICmsEntryOpenSearchBodyBuilderParams {
    model: CmsModel;
    params: Omit<CmsEntryListParams, "where" | "after"> & {
        where: CmsEntryListWhere;
        after?: PrimitiveValue[];
    };
}

export interface ICmsEntryOpenSearchBodyBuilder {
    build(params: ICmsEntryOpenSearchBodyBuilderParams): SearchBody;
}

export const CmsEntryOpenSearchBodyBuilder = createAbstraction<ICmsEntryOpenSearchBodyBuilder>(
    "Cms/Entry/OpenSearch/BodyBuilder"
);

export namespace CmsEntryOpenSearchBodyBuilder {
    export type Interface = ICmsEntryOpenSearchBodyBuilder;
    export type Params = ICmsEntryOpenSearchBodyBuilderParams;
}
```

### Implementation

**File**: `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyBuilder/CmsEntryOpenSearchBodyBuilderImpl.ts`

```typescript
import type { SearchBody } from "@webiny/api-opensearch";
import type { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CmsEntryOpenSearchBodyBuilder } from "./abstractions.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
import type { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
import type { CmsEntryOpenSearchQueryModifier } from "~/features/CmsEntryOpenSearchQueryModifier/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import type { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
import type { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";
import { createElasticsearchBody } from "../../operations/entry/elasticsearch/body.js";

class CmsEntryOpenSearchBodyBuilderClass implements CmsEntryOpenSearchBodyBuilder.Interface {
    public constructor(
        private readonly operatorRegistry: OpenSearchQueryBuilderOperatorRegistry.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        private readonly fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private readonly bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[],
        private readonly sortModifiers: CmsEntryOpenSearchSortModifier.Interface[],
        private readonly queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[],
        private readonly valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface,
        private readonly fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[],
        private readonly filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface,
        private readonly fieldFactory: OpenSearchFieldFactory.Interface
    ) {}

    public build(params: CmsEntryOpenSearchBodyBuilder.Params): SearchBody {
        return createElasticsearchBody({
            operatorRegistry: this.operatorRegistry,
            model: params.model,
            fieldRegistry: this.fieldRegistry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            bodyModifiers: this.bodyModifiers,
            sortModifiers: this.sortModifiers,
            queryModifiers: this.queryModifiers,
            valueSearchRegistry: this.valueSearchRegistry,
            fullTextSearches: this.fullTextSearches,
            filterRegistry: this.filterRegistry,
            fieldFactory: this.fieldFactory,
            params: params.params
        });
    }
}

export const CmsEntryOpenSearchBodyBuilderImpl = 
    CmsEntryOpenSearchBodyBuilder.createImplementation({
        implementation: CmsEntryOpenSearchBodyBuilderClass,
        dependencies: [
            OpenSearchQueryBuilderOperatorRegistry,
            CmsModelFieldToGraphQLRegistry,
            CmsEntryOpenSearchFieldIndexRegistry,
            [CmsEntryOpenSearchBodyModifier, { multiple: true }],
            [CmsEntryOpenSearchSortModifier, { multiple: true }],
            [CmsEntryOpenSearchQueryModifier, { multiple: true }],
            CmsEntryOpenSearchValueSearchRegistry,
            [CmsEntryOpenSearchFullTextSearch, { multiple: true }],
            CmsEntryOpenSearchFilterRegistry,
            OpenSearchFieldFactory
        ]
    });
```

### Feature

**File**: `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyBuilder/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchBodyBuilderImpl } from "./CmsEntryOpenSearchBodyBuilderImpl.js";

export const CmsEntryOpenSearchBodyBuilderFeature = createFeature({
    name: "Cms/Entry/OpenSearch/BodyBuilderFeature",
    register: container => {
        container.register(CmsEntryOpenSearchBodyBuilderImpl);
    }
});
```

### Usage Impact (Callers)

**Before** (ddb-es, 4 params → 12+):
```typescript
const body = createElasticsearchBody({
    model, fieldRegistry, fieldIndexRegistry, bodyModifiers,
    sortModifiers, queryModifiers, valueSearchRegistry,
    fullTextSearches, filterRegistry, fieldFactory,
    params: { ...params, limit, after: decodeCursor(...) },
    operatorRegistry
});
```

**After** (injected once, 2 params):
```typescript
// At module init, once:
const bodyBuilder = container.resolve(CmsEntryOpenSearchBodyBuilder);

// In each operation:
const body = bodyBuilder.build({
    model,
    params: { ...params, limit, after: decodeCursor(...) }
});
```

### Integration Points

**Both packages must register feature**:
- `packages/api-headless-cms-ddb-es/src/feature.ts`
- `packages/api-headless-cms-pg-os/src/feature.ts`

Add: `container.register(CmsEntryOpenSearchBodyBuilderFeature)`

## Summary

| Aspect | Finding |
|--------|---------|
| **Stateless** | ✓ Yes—pure function, no internal state |
| **Multiple callers** | ✓ Yes—4 call sites, identical patterns |
| **Complex dependencies** | ✓ Yes—12+ abstractions |
| **Testability gain** | ✓ High—enables isolated unit tests of body construction |
| **Code reduction** | ✓ High—eliminates 8× parameter duplication |
| **Risk** | Low—wraps existing function, no logic change |
| **Precedent in codebase** | ✓ Yes—matches `CmsEntryOpenSearchIndexCreate` pattern |

**Verdict**: Extract to DI feature. Improves testability, reduces caller complexity, enforces consistency across ddb-es and pg-os packages.
