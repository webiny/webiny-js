# fullTextSearch — DI Analysis

## Current State

### fullTextSearch.ts
- **Exports:** `applyFullTextSearch(params: Params): void`
- **Behavior:** Main entry point that applies full-text search to an OpenSearch query
- **Process:**
  1. `getFullTextSearch()` selects appropriate implementation from registry of `CmsEntryOpenSearchFullTextSearch.Interface[]`
  2. Priority: specific model implementation → fallback (no models) → default hardcoded
  3. Calls selected implementation's `apply()` with prepared context (field mapping, term normalization)

### fullTextSearchFields.ts
- **Exports:** `createFullTextSearchFields(params: Params): ModelFields`
- **Behavior:** Filters model fields to only those in search targets
- **Logic:** Simple filtering—returns subset of fields matching `targets` array

### Relationship
- **Sequential:** `fullTextSearchFields` → `applyFullTextSearch`
- **Used in:** `body.ts` only, called as discrete utilities
- **Dependencies:**
  - `fullTextSearch.ts` imports: `OpenSearchBoolQueryConfig`, `normalizeValue`, types
  - `fullTextSearchFields.ts` imports: types only

## Dependencies

### applyFullTextSearch
- **Runtime inputs:**
  - `fullTextSearches`: `CmsEntryOpenSearchFullTextSearch.Interface[]` (from DI registry)
  - `model`, `query`, `term`, `fields`, other query builders
- **Side effects:** Modifies query object in-place
- **External calls:** None—pure logic + delegation to `CmsEntryOpenSearchFullTextSearch` implementations

### createFullTextSearchFields
- **Runtime inputs:** Plain objects (`fields`, `term`, `targets`)
- **Side effects:** None
- **External calls:** None—pure utility

## Callers

```
Refs:
- packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/body.ts:92
- packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/body.ts:107
```

**Calling context:**
- `body.ts` is NOT a feature—it's a pure utility that builds OpenSearch query bodies
- `createElasticsearchBody()` is called from `api-headless-cms-pg-os` and `api-headless-cms-ddb-es`
- Both call sites are inside `createEntriesStorageOperations()`, which receives pre-resolved registries
- Registries (`fullTextSearches` array) are resolved at container setup time in `HeadlessCmsPgOsFeature` (line 91):
  ```typescript
  const fullTextSearches = container.resolveAll(CmsEntryOpenSearchFullTextSearch);
  ```

## DI Recommendation

**NO** — both files should **remain as pure utilities**, not become DI features.

### Reasoning

1. **Inappropriate abstraction level**
   - Both operate on **data transformation**, not service contracts
   - `createFullTextSearchFields`: deterministic filtering (zero logic variation)
   - `applyFullTextSearch`: orchestration of existing `CmsEntryOpenSearchFullTextSearch` implementations—already delegated to DI
   - Adding DI wrapper adds indirection without extensibility benefit

2. **Already leveraging DI correctly**
   - `applyFullTextSearch` does **not** need DI—it consumes `fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[]`
   - That array is already resolved from DI and passed in at call site
   - The **strategy selection logic** (choosing which implementation to apply) is internal and model-specific; not a contract point

3. **Body builder is a pure composition function**
   - `body.ts` (`createElasticsearchBody`) is a **pure function** taking parameters
   - It doesn't benefit from singleton/container lifecycle management
   - Direct imports and function calls are clearer than `container.resolve(CreateElasticsearchBody)`
   - Zero cross-cutting concerns (logging, caching, conditional setup)

4. **Existing pattern: utility functions in this codebase**
   - Similar utilities exist: `createModelFields()`, `createInitialQuery()`, `createExecFiltering()` all in same directory
   - None are features; all are imported and called directly
   - Consistency: keep this suite of helpers as a cohesive utility layer

5. **No variation point**
   - No consumer need to swap `applyFullTextSearch` or `createFullTextSearchFields` implementations
   - Feature pattern (with `modelId` filters, multiple registrations) is unused here
   - The **extensibility** (custom full-text strategies per model) happens at `CmsEntryOpenSearchFullTextSearch` level—already a proper feature

## If Forced to Make DI

**Only if** the following requirement emerged:

- Different entry storage backend (not PG+OS, not DDB+ES) needed **different** full-text search orchestration logic
- OR custom full-text filtering needed to be swappable at the query-building level (e.g., disable FTS for certain models)

**Then propose:**
```typescript
// abstractions.ts
export interface IFullTextSearchApplier {
  apply(params: ApplyFullTextSearchParams): void;
}
export const FullTextSearchApplier = createAbstraction<IFullTextSearchApplier>(
  "Cms/Entry/OpenSearch/FullTextSearchApplier"
);

// implementation wraps applyFullTextSearch logic
class FullTextSearchApplierImpl implements IFullTextSearchApplier.Interface { ... }
export const FullTextSearchApplierFeature = createFeature({
  register: container => {
    container.register(FullTextSearchApplierImpl.createImplementation({ ... }))
  }
});
```
But this adds boilerplate without solving a real problem today.

## Conclusion

Keep `fullTextSearch.ts` and `fullTextSearchFields.ts` as **pure utilities**. They delegate extensibility to the correct layer (`CmsEntryOpenSearchFullTextSearch` registry). DI features are for **service contracts and lifecycle**, not data transformations.
