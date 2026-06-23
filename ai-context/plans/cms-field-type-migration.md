# CMS Field Type Plugin Migration

## Context

The CMS uses two parallel systems for field types:

- **Old**: `CmsModelFieldTypePlugin` plugins (`cms-editor-field-type`) — global plugin registry
- **New**: `CmsFieldType` DI abstraction — container-registered, used by `FieldEditorPresenter`

The old plugins carry `graphql.queryField` (client-side GraphQL selection generation), `render()` (model editor nested UI), `renderSettings()` (field settings dialog), and metadata. The new system already handles settings via `CmsFieldEditorGroup`/`CmsFieldEditorGroupModifier`. This plan migrates the remaining concerns.

---

## Phase 1: Backend — `valuesSelection` field on `CmsContentModel`

**Goal**: The backend generates the GraphQL `values { ... }` selection string for a model, so the frontend doesn't need field-type-specific GraphQL logic.

### What to do

1. **New utility** `astToValuesSelection(ast, model)` — walks the AST and produces a GraphQL selection string:
   - `"field"` node with no children → `field.fieldId`
   - `"field"` node with children → `field.fieldId { ...recurse children... }`
   - `"collection"` node → `...on TypeName { ...recurse children... _templateId __typename }`
   - The TypeName for collections comes from the model's `singularApiName` + field's `fieldId` + template's `gqlTypeName` (matching how `DynamicZoneToGraphQL` builds types)

   Location: `packages/api-headless-cms/src/utils/contentModelAst/astToValuesSelection.ts`

2. **Add `valuesSelection: String` to `CmsContentModel` GraphQL type**
   - File: `packages/api-headless-cms/src/graphql/schema/contentModels.ts`
   - Add field resolver on `CmsContentModel` (line ~57) that calls `getModelToAstConverter().toAst(model)` then `astToValuesSelection(ast, model)`

3. **Tests**: Unit test for `astToValuesSelection` with cases for flat fields, nested objects, refs, dynamic zones, and empty models.

### Key reference

- `CmsModelToAstConverter` at `packages/api-headless-cms/src/utils/contentModelAst/CmsModelToAstConverter.ts`
- `getModelToAstConverter()` at `packages/api-headless-cms/src/crud/contentModel.crud.ts:32`
- Existing GraphQL type prefix pattern: `${model.singularApiName}_${createTypeName(fieldId)}`
- DZ template type: `${prefix}_${template.gqlTypeName}`
- Ref selection: `{ modelId id }` (hardcoded, not recursive)

### Verify

- [ ] `yarn test packages/api-headless-cms` — existing tests pass
- [ ] New unit test for `astToValuesSelection` passes
- [ ] Query `getContentModel` returns `valuesSelection` with correct nested selections

---

## Phase 2: Frontend — Use `model.valuesSelection`, remove `createFieldsList`

**Goal**: Frontend queries use the backend-provided selection string instead of generating it client-side.

### What to do

1. **Add `valuesSelection` to frontend model type**
   - `packages/app-headless-cms-common/src/types/model.ts` — add `valuesSelection?: string` to `CmsModel`/`CmsEditorContentModel`

2. **Add to GraphQL query fragments**
   - `packages/app-headless-cms/src/admin/graphql/contentModels.ts` — add `valuesSelection` to `MODEL_FIELDS`

3. **Replace `createFieldsList` calls** — all sites that build `values { ... }` blocks use `model.valuesSelection` instead. Key locations:
   - `packages/app-headless-cms-common/src/entries.graphql.ts` — `createListQueryDataSelection()` and `createReadQueryDataSelection()` etc.
   - `packages/app-headless-cms/src/features/contentEntry/listEntries/ListEntriesGateway.ts`
   - `packages/app-headless-cms/src/features/contentEntry/getEntry/GetEntryGateway.ts`
   - `packages/app-aco/src/graphql/records/common.ts`
   - `packages/app-aco/src/features/folders/folderModelProvider/FolderModelProvider.ts`

4. **Remove `graphql` from old field plugins** — `object.tsx`, `ref.tsx`, `dynamicZone.tsx`

5. **Deprecate `createFieldsList`** — mark as deprecated or remove if no remaining callers

### Verify

- [ ] `yarn check` on app-headless-cms, app-headless-cms-common, app-aco
- [ ] Content entries with object, ref, dynamic zone fields load correctly
- [ ] Updating a model (adding/removing fields) → re-fetching entries uses updated selection
- [ ] ACO records still load

---

## Phase 3: Extend `ICmsFieldType` with model editor properties

**Goal**: Move metadata, nested editor rendering, and drag-and-drop logic from old plugins to `CmsFieldType`.

### What to do

1. **Extend `ICmsFieldType` interface** (`presentation/fieldTypes/abstractions.ts`):

   ```
   hideInAdmin?: boolean
   tags?: string[]
   allowLayout?: boolean
   canAccept?(field, draggable): boolean
   renderEditor?(params): React.ReactNode
   ```

2. **Add properties to each field type implementation** (`presentation/fieldTypes/types/*.ts`):
   - `ObjectFieldType`: `allowLayout: true`, `canAccept` (accept most fields), `renderEditor` (nested `FieldEditor`)
   - `DynamicZoneFieldType`: `renderEditor` (template management UI — `DynamicZone` component)
   - Layout types (separator, alert, tabs — need new type implementations): `tags: ["Layout"]`, `renderEditor` (their visual UI)
   - Leaf types (text, number, etc.): no `renderEditor` needed

3. **Migrate consumers to resolve from DI instead of plugin registry**:
   - `FieldsSidebar.tsx` — resolve all `CmsFieldType` instances, use `hideInAdmin`/`tags` for filtering
   - `Field.tsx` — use `fieldType.renderEditor()` instead of `fieldPlugin.field.render()`
   - `FieldEditorContext.tsx` — resolve `CmsFieldType` for field operations
   - `getDragInfo.tsx` — use `fieldType.canAccept`/`allowLayout`
   - `LayoutCell.tsx` — use `fieldType.renderEditor()` for layout fields
   - `useModelField.ts` — return `CmsFieldType` instead of `CmsModelFieldTypePlugin`

### Verify

- [ ] `yarn check` on app-headless-cms, app-headless-cms-common
- [ ] Model editor: field sidebar shows all types, drag-and-drop works
- [ ] Object fields show nested field editor
- [ ] Dynamic zone shows template management UI
- [ ] Layout fields (separator, alert, tabs) render correctly

---

## Phase 4: Remove old field type plugins

**Goal**: Delete old plugin files and their registration.

### What to do

1. Remove plugin files from `packages/app-headless-cms/src/admin/plugins/fields/`
2. Remove plugin imports from `packages/app-headless-cms/src/allPlugins.ts`
3. Remove `CmsModelFieldTypePlugin` type usage from `app-headless-cms-common` (keep type definition for backwards compat if needed)
4. Remove `createFieldsList` if fully unused

### Verify

- [ ] Full typecheck passes
- [ ] No runtime errors
- [ ] All manual tests from previous phases still pass
