# sort.ts — DI Analysis

## Current State

**Export:** `createElasticsearchSort(params: Params): OpenSearchSort`

**Location:** `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/sort.ts`

**Purpose:** Transforms a `CmsEntryListSort` request into an OpenSearch sort configuration object. Maps field IDs to their storage paths, builds field plugin metadata, and produces the final sort array.

**Size:** 127 LOC

**Algorithm:**
1. Match incoming sort strings against field patterns (`values_<fieldId>_<ASC|DESC>` or `<fieldId>_<ASC|DESC>`)
2. Build field-to-path mapping from model fields
3. Create OpenSearch field plugins for each sortable field (handles keywords, unmapped types, etc.)
4. Transform matched sort fields using the mapping
5. Delegate to `createSort()` from `@webiny/api-opensearch` to build final sort array

## Dependencies

**Imports:**
- `@webiny/api-opensearch`: `createSort`, `Sort`, `OpenSearchField`, `OpenSearchFieldFactory`
- `@webiny/api-headless-cms/types`: `CmsEntryListSort`, `CmsModel`
- `./keyword.js`: `hasKeyword(field)` — checks if field has keyword variant
- `./filtering/path.js`: `createFieldPathFactory()` — builds field paths for filtering/sorting
- `~/values/NoValueContainer.js`: `NoValueContainer` — placeholder for field value access

**Injected Parameters:**
- `valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface` — used by path factory
- `fieldFactory: OpenSearchFieldFactory.Interface` — creates field plugin descriptors
- `modelFields: ModelFields` — map of field metadata (types, parents, unmappedType, sortable, etc.)
- `model: CmsModel` — entry schema

**Parameter Flow:**
```
createElasticsearchSort(...)
  ├─ createFieldPathFactory({ valueSearchRegistry })
  │   └─ uses registry to resolve field paths
  └─ fieldFactory.create(...)
      └─ creates OS field plugins with metadata
```

## Callers

**Single Caller:**
- **`body.ts`** (line 132–137)
  ```typescript
  const sort = createElasticsearchSort({
      sort: initialSort,
      modelFields,
      model,
      valueSearchRegistry,
      fieldFactory
  });

  for (const modifier of applicableSortModifiers) {
      modifier.modifySort({ sort, model });
  }
  ```

**Caller Context:**
- Called from `createElasticsearchBody()` in the same package
- Used by `createEntriesStorageOperations()` in `api-headless-cms-pg-os` and `api-headless-cms-ddb-es`
- Part of entry list query construction pipeline

**Downstream:** Sort is passed to OpenSearch search request and optionally modified by `CmsEntryOpenSearchSortModifier` plugins before being sent.

## Code Structure

The function is internal/private to `body.ts` usage:
- No test file found for this function alone
- No external consumers (grepped entire `packages/` tree)
- No alternate implementations or overrides
- Helper function `matchField()` is tightly coupled to sort logic

## Similar Patterns in Same Directory

Other elasticsearch operation utilities that are NOT DI-wrapped:
- `fullTextSearch.ts` → `createFullTextSearch()` + `applyFullTextSearch()` (used by body.ts)
- `initialQuery.ts` → `createInitialQuery()` (used by body.ts)
- `fields.ts` → `createModelFields()` (used by body.ts)
- `fullTextSearchFields.ts` → `createFullTextSearchFields()` (used by body.ts)

These are all pure utility functions, called directly, without DI abstraction.

## Existing Sort Modification Pattern

**`CmsEntryOpenSearchSortModifier`** (DI feature):
- Abstraction: `ICmsEntryOpenSearchSortModifier.modifySort(params: ModifySortParams)`
- Allows plugins to mutate an already-created sort array
- Applied AFTER `createElasticsearchSort()` completes
- This is the extension point for sort customization

**Design pattern:** Separation of concerns —
- Core sort creation → deterministic utility
- Sort customization → pluggable modifier chain

## DI Recommendation

**NO** — Do not convert to DI feature.

**Reasoning:**

1. **Single Internal Caller**
   - Only `body.ts` calls it (never exported, never used elsewhere)
   - All external packages call via `createElasticsearchBody()` indirectly

2. **No Pluggability Need**
   - Sort creation logic is deterministic and model-driven
   - Field mapping is determined by model schema + field registry (already injected into `createElasticsearchBody`)
   - No business logic that varies by tenant, deployment, or feature flag

3. **Existing Extension Point**
   - `CmsEntryOpenSearchSortModifier` already provides sort customization
   - Plugins can wrap, reorder, or replace sort fields after creation
   - Adding DI here would create redundant pluggability

4. **Pattern Consistency**
   - Similar utilities in same directory (`fullTextSearch.ts`, `initialQuery.ts`, `fields.ts`) remain plain functions
   - This package keeps utility creators as functions, reserves DI for registries/modifiers

5. **Complexity Trade-off**
   - Wrapping would require: abstraction interface, implementation class, DI registration, feature setup
   - No corresponding benefit in flexibility or testability
   - Tests would still exercise same algorithm and dependencies

6. **Parameter Complexity Already Managed**
   - Dependencies (`valueSearchRegistry`, `fieldFactory`, `modelFields`) are passed as parameters
   - No hidden state, no initialization concerns
   - Pure function ✓

## If DI Were Chosen (Not Recommended)

For reference, if this were converted despite recommendation:

**Abstraction Name:** `CmsEntryOpenSearchSortBuilder`

**Interface Shape:**
```typescript
export interface ICmsEntryOpenSearchSortBuilder {
    build(params: {
        sort?: CmsEntryListSort;
        modelFields: ModelFields;
        model: CmsModel;
        valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
        fieldFactory: OpenSearchFieldFactory.Interface;
    }): OpenSearchSort;
}
```

**Dependencies to Inject:**
- `CmsEntryOpenSearchValueSearchRegistry` (for path factory)
- `OpenSearchFieldFactory` (for field plugins)

**Feature Structure:**
- `abstractions/CmsEntryOpenSearchSortBuilder.ts` — interface
- `CmsEntryOpenSearchSortBuilder.ts` — implementation (move 127 LOC here)
- `feature.ts` — `createFeature()` registration
- `index.ts` — barrel export

**Cost:** 4 new files, 1 DI registration, updated 2 call sites in `body.ts`

**Benefit:** None compelling

---

## Conclusion

Keep `createElasticsearchSort()` as a plain utility function. Use `CmsEntryOpenSearchSortModifier` for sort customization needs. This maintains clarity of intent: core transformations are deterministic utilities; behavioral variation flows through modifier chains.
