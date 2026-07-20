# fields — DI Analysis

## Current State

The fields module in `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/` consists of five files:

### **fields.ts** (Main module)
- **`createModelFields(params)`** — Primary export; builds complete OpenSearch field map for a CMS model by merging system fields with model-specific fields. Takes `model`, `fieldRegistry` (CmsModelFieldToGraphQLRegistry), and `fieldIndexRegistry` (CmsEntryOpenSearchFieldIndexRegistry) as params. Returns `ModelFields` object mapping field identifiers to `ModelField` objects.
- **`createSystemFields()`** — Internal helper; generates static system fields (id, entryId, status, version, state, live, location, wbyDeleted, plus datetime/identity meta fields).
- **`buildFieldsList(params)`** — Internal recursive helper; processes model fields and builds flat mapping with parent relationships for nested/object fields.

### **createSystemField.ts** (Utility)
- **`createSystemField(field)`** — Simple wrapper around `createModelField()` from @webiny/api-headless-cms. Adds defaults (id = fieldId, label = fieldId). No dependencies. Pure function.

### **live.ts** (Static export)
- **`liveFields`** — Static object exporting system field definitions for `live` and `live.version` fields. Uses `createSystemField()` and `createModelField()`. Immutable.

### **state.ts** (Static export)
- **`stateFields`** — Static object exporting system field definitions for `state`, `state.stepId`, `state.stepName`, `state.state` fields. Uses `createSystemField()` and `createModelField()`. Immutable.

### **location.ts** (Static export)
- **`locationFields`** — Static object exporting system field definitions for `wbyAco_location` and `wbyAco_location.folderId` fields. Uses `createSystemField()` and `createModelField()`. Immutable.

## Dependencies

**Internal dependencies within module:**
- `createSystemField()` ← used by live.ts, state.ts, location.ts
- `liveFields`, `stateFields`, `locationFields` ← imported by fields.ts
- `createModelField()` from @webiny/api-headless-cms ← used by live.ts, state.ts, location.ts, createSystemField.ts

**External dependencies (DI-managed):**
- `CmsModelFieldToGraphQLRegistry` ← passed as param to createModelFields()
- `CmsEntryOpenSearchFieldIndexRegistry` ← passed as param to createModelFields()

**External dependencies (non-DI):**
- `ENTRY_META_FIELDS`, field type utilities from @webiny/api-headless-cms
- `getBaseFieldType()` from @webiny/api-headless-cms/utils

## Callers

**Direct callers within package:**
- `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/body.ts:64` — calls `createModelFields()` to build model fields for OpenSearch query building. Passes fieldRegistry and fieldIndexRegistry from parent function params.

**Indirect callers (via body.ts):**
- `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts:1364,2081` — imports and calls `createElasticsearchBody()`, which internally uses `createModelFields()`
- `packages/api-headless-cms-pg-os/src/operations/entry/index.ts:325,404` — imports and calls `createElasticsearchBody()`, which internally uses `createModelFields()`

**External exposure:**
- Not exported from `packages/api-headless-cms-utils-os/src/index.ts`; fields module is internal-only
- No external package imports from this module

**Test coverage:**
- No tests found in api-headless-cms-utils-os (no __tests__ directory)
- Not directly tested elsewhere

## DI Recommendation

### Summary
**NO conversion recommended at this time.** The module is well-designed as utilities with internal helper functions. Conversion would add complexity without clear architectural benefit.

### Detailed Analysis per Component

#### **createSystemField** → NO
- **Reason:** Pure utility function with no dependencies; acts as thin wrapper around createModelField with defaults.
- **Alternative:** Keep as utility; no need for abstraction or DI.

#### **liveFields, stateFields, locationFields** → NO (currently); MAYBE (future extensibility)
- **Reason:** Static, immutable field definitions. No runtime behavior, no state, no multiple implementations.
- **Future consideration:** IF system fields become extensible via plugin system (e.g., custom entry metadata fields), a `CmsEntryOpenSearchSystemFieldsRegistry` feature could allow extensions to register additional system fields. This would require:
  - Registry pattern (similar to CmsEntryOpenSearchFieldIndex)
  - Registration hook in features
  - Lazy loading instead of static imports
- **Current status:** Low priority; hardcoded system fields have not required extension in existing codebase.

#### **createModelFields** → NO
- **Why it might seem like a DI candidate:**
  - Other OpenSearch features (BodyModifier, SortModifier, QueryModifier) use DI pattern
  - Could be injected as a service into operations
  - Naming/responsibility suggests it could be part of feature ecosystem
  
- **Why NOT a good fit for DI:**
  - **Already follows DI via parameters:** Registries (fieldRegistry, fieldIndexRegistry) are DI-managed and passed as parameters. This is dependency injection pattern—just explicit rather than via service container.
  - **No multiple implementations:** Always builds fields the same way; no swappable behavior or plugin variants.
  - **Pure function:** Stateless, no side effects, no initialization needed. DI container adds ceremony without value.
  - **Low call frequency:** Called once per entry list operation in body building phase; not performance-sensitive or instance-creation sensitive.
  - **Clear responsibility:** Single, focused task; no delegation to subtasks that would benefit from DI composition.

- **Alternative:** Keep as utility function called from body.ts. Current pattern is clean and explicit.

## If YES — Proposed Design (Not Recommended)

If future requirements necessitated DI conversion (e.g., swappable field building logic per model type), the design would be:

```typescript
// abstractions.ts
export interface ICmsEntryOpenSearchFieldsBuilder {
    build(params: {
        model: CmsModel;
        fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
        fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    }): ModelFields;
}

export const CmsEntryOpenSearchFieldsBuilder = 
    createAbstraction<ICmsEntryOpenSearchFieldsBuilder>(
        "Cms/Entry/OpenSearch/FieldsBuilder"
    );

// implementation.ts
class CmsEntryOpenSearchFieldsBuilderImpl 
    implements CmsEntryOpenSearchFieldsBuilder.Interface {
    build(params) {
        // Current createModelFields logic here
    }
}

export const CmsEntryOpenSearchFieldsBuilderImpl = 
    CmsEntryOpenSearchFieldsBuilder.createImplementation({
        implementation: CmsEntryOpenSearchFieldsBuilderImpl,
        dependencies: []  // No dependencies beyond params
    });
```

**Dependencies array would be empty** because registries are runtime parameters, not container-injected.

---

## Conclusion

The fields module represents **good separation of concerns** and **appropriate use of utilities + data constants**. It currently achieves dependency injection goals through explicit parameter passing, which is cleaner and more maintainable than service container injection for this use case.

No action required. Monitor for future extensibility needs (custom system fields) which might trigger registry+feature conversion.
