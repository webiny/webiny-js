# Utility Files — DI Analysis

Research date: 2026-07-17  
Scope: `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/` utilities  
Goal: Determine which utilities can/should be converted to DI-style features

---

## Per-File Analysis

### initialQuery.ts

**Current state:**
- Exports: `createBaseQuery()`, `createInitialQuery(params)`
- Pure utility functions for constructing OpenSearch bool queries
- Dependencies: `WebinyError`, type imports, helper functions from sibling modules
- No external registries or runtime configuration

**Callers:**
- `elasticsearch/body.ts` — calls `createInitialQuery()` to initialize query (line 100)
- `elasticsearch/filtering/exec.ts` — calls `createBaseQuery()` for AND/OR handling (lines 64, 78)
- `__tests__/filtering/mocks/query.ts` — test mock

**DI Recommendation: NO**
- Pure query-building utilities with no state or pluggable behavior
- No testability gain from DI; tested via their caller contracts
- Tightly coupled to OpenSearch query shape, not replaceable

---

### keyword.ts

**Current state:**
- Exports: `hasKeyword(field: ModelField): boolean`
- Pure field-inspection function
- Dependencies: `getBaseFieldType` utility from api-headless-cms
- Hardcoded list of non-keyword field types

**Callers:**
- `elasticsearch/sort.ts` — determines whether to add `.keyword` suffix (lines 8, 91)
- `elasticsearch/filtering/applyFiltering.ts` — determines field path suffix (lines 3, 42)

**DI Recommendation: NO**
- Pure decision function with no runtime configuration needed
- No external state or registry
- Hardcoded field-type rules are not intended to be overridden

---

### transformValueForSearch.ts

**Current state:**
- Exports: `transformValueForSearch(params: { valueSearchRegistry, field, value })`
- **Already accepts `valueSearchRegistry` as a parameter** ✓
- Delegates to field-type-specific transformers from registry
- Simple pass-through orchestrator

**Callers:**
- `elasticsearch/filtering/applyFiltering.ts` — normalizes user-provided filter values (line 36)

**DI Recommendation: YES** ✓
- **Already follows DI input pattern** (registry passed as param)
- Single caller makes refactoring low-risk
- Candidate for feature wrapper to make it pluggable/overridable
- Would allow: custom transformers per field type, caching, validation layers

**Implementation notes:**
- Currently: stateless orchestrator function
- As feature: wrap in abstraction + implementation class
- No breaking changes needed; registry already injected at call site

---

### assignMinimumShouldMatchToQuery.ts

**Current state:**
- Exports: `assignMinimumShouldMatchToQuery(params: { query, value? })`
- Pure in-place mutation of query object
- Dependencies: None (only type imports)
- Default behavior: set `minimum_should_match = 1` if `should` array exists and not already set

**Callers:**
- `elasticsearch/body.ts` — assigns after filtering (line 154)
- `elasticsearch/filtering/exec.ts` — assigns after OR conditions (line 90)

**DI Recommendation: NO**
- Pure deterministic mutation with no external state
- Behavior is well-defined and rarely needs override
- No registry or configuration required
- Two callers use it the same way (no variation needed)

---

### shouldIgnoreEsResponseError.ts

**Current state:**
- Exports: `shouldIgnoreEsResponseError(error: WebinyError): boolean`
- Checks error message against hardcoded list of ignorable exception types
- Currently ignores: `index_not_found_exception`, `search_phase_execution_exception`
- No external dependencies or state

**Callers across multiple packages:**
- `api-headless-cms-pg-os/src/operations/entry/index.ts` — during list operations
- `api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchFetcher.ts` — sync skip logic
- `api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/shouldIgnoreEsResponseError.ts` — **defines identical function locally**
- `api-headless-cms-ddb-es/src/operations/entry/index.ts` — during list operations

**DI Recommendation: MAYBE** (lean toward NO)
- Used across **3+ packages** (high reuse)
- Cross-package duplication exists (api-elasticsearch-tasks defines same function locally with different constants)
- Hardcoded exception list is environment/use-case specific
- Current callers don't need variation, but future ones might

**Caveats:**
- If making the exception list configurable, move to feature
- Currently not a priority; duplication is acceptable given rarity of changes
- Would require coordination across packages to avoid proliferation

---

### plugins/operator.ts

**Current state:**
- Exports: `createOperatorPluginList(params: { registry })`
- **Already accepts `OpenSearchQueryBuilderOperatorRegistry` as parameter** ✓
- Orchestrator: converts registry array into keyed operator map
- No state; deterministic transformation of registry data

**Callers:**
- `elasticsearch/filtering/exec.ts` — populates operator lookup map (line 37)

**DI Recommendation: YES** ✓
- **Already follows DI input pattern** (registry passed as param)
- Single caller, low refactoring risk
- Candidate for feature wrapper if operator retrieval logic needs to be pluggable
- Would allow: operator caching, filtering, custom resolution logic

**Implementation notes:**
- Currently: simple reducer over registry results
- As feature: wrap to allow pre/post-processing of operator list
- Minimal code, but high value if operator selection needs to be customized

---

### types.ts

**Current state:**
- Exports: Type definitions only (`ModelField`, `ModelFields`, `FieldType`, `ModelFieldParent`, `OpenSearchQueryBuilderOperators`)
- Supporting types for filtering/sorting pipeline
- No implementation code

**DI Recommendation: NO**
- Type definitions are not features
- Should remain as shared type exports
- Consider grouping with related domain types if reorganizing

---

## Summary

| File | Current State | Callers | DI Candidate | Reasoning |
|------|---------------|---------|--------------|-----------|
| `initialQuery.ts` | Pure query builder | 2 | **NO** | No registry, pure utility, no variation needed |
| `keyword.ts` | Pure field inspector | 2 | **NO** | No registry, hardcoded rules, not pluggable |
| `transformValueForSearch.ts` | Registry orchestrator | 1 | **YES** ✓ | Accepts registry param, single caller, pluggable |
| `assignMinimumShouldMatchToQuery.ts` | Pure mutation | 2 | **NO** | Deterministic, no external state, no variation |
| `shouldIgnoreEsResponseError.ts` | Static error filter | 3+ | **MAYBE** | Reused cross-package, but hardcoded; duplication exists |
| `plugins/operator.ts` | Registry orchestrator | 1 | **YES** ✓ | Accepts registry param, single caller, pluggable |
| `types.ts` | Type definitions | N/A | **NO** | Types, not implementations |

---

## Conversion Priority

### High Priority (YES):
- **`transformValueForSearch.ts`** — Already structured for DI, minimal refactoring
- **`plugins/operator.ts`** — Already structured for DI, minimal refactoring
- Both would benefit from being pluggable/overridable features
- Both have single known callers (low risk)

### Medium Priority (MAYBE):
- **`shouldIgnoreEsResponseError.ts`** — Cross-package usage suggests standardization, but currently low change frequency; defer unless error-handling logic needs customization

### Low Priority (NO):
- `initialQuery.ts`, `keyword.ts`, `assignMinimumShouldMatchToQuery.ts` — Pure utilities with hardcoded logic; no DI benefit
- `types.ts` — Shared types; keep as-is

---

## Implementation Pattern (if converted)

Using existing package pattern (e.g., `CmsEntryOpenSearchIndexCreate`):

```typescript
// abstractions.ts
export const MyUtility = createAbstraction<IMyUtility>("Cms/Entry/MyUtility");

// MyUtilityImpl.ts
export const MyUtilityImpl = MyUtility.createImplementation({
    implementation: MyUtilityClass,
    dependencies: [/* injected deps */]
});

// feature.ts
export const MyUtilityFeature = new WebinyFeature({
    name: "CmsEntryMyUtility",
    setup: context => context.di.register(MyUtilityImpl)
});
```

Current `transformValueForSearch` and `plugins/operator` are stateless, so implementations would be lightweight (thin wrappers or composition).

