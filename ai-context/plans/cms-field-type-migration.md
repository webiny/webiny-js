# CMS Field Type Plugin Migration

## Context

The CMS uses two parallel systems for field types:

- **Old**: `CmsModelFieldTypePlugin` plugins (`cms-editor-field-type`) — global plugin registry
- **New**: `CmsFieldType` DI abstraction — container-registered, used by `FieldEditorPresenter`

The old plugins carry `graphql.queryField` (client-side GraphQL selection generation), `render()` (model editor nested UI), `renderSettings()` (field settings dialog), and metadata. The new system already handles settings via `CmsFieldEditorGroup`/`CmsFieldEditorGroupModifier`. This plan migrates the remaining concerns.

---

## Phase 1: Backend — `valuesSelection` field on `CmsContentModel`

- [x] `ValuesSelectionGenerator` abstraction + implementation + feature + tests
- [x] `valuesSelection: String` on `CmsContentModel` GraphQL type
- [x] All backend tests pass

---

## Phase 2: Frontend — Use `model.valuesSelection`, remove `createFieldsList`

- [x] `valuesSelection` on frontend `CmsModel` type + `MODEL_FIELDS` query
- [x] `getValuesBlock(model)` helper with fallback
- [x] All `entries.graphql.ts` callers migrated
- [x] `GetEntryGateway` migrated
- [x] ACO `FolderModelProvider` + `common.ts` migrated
- [x] `graphql.queryField` removed from object, ref, dynamicZone plugins
- [x] Leaf field plugins deleted (text, longText, richText, number, boolean, dateTime, json, searchableJson)
- [ ] Manual verify: content entries with object, ref, dynamic zone load correctly
- [ ] Manual verify: ACO records load

---

## Phase 3: Extend `ICmsFieldType` with model editor properties

- [x] `ICmsFieldType` extended: `hideInAdmin`, `tags`, `canEditSettings`, `allowLayout`, `canAccept`, `renderEditor`, `renderInfo`
- [x] Icons changed to `React.ReactElement` — all implementations updated with SVG imports
- [x] `ObjectFieldType.renderEditor`, `DynamicZoneFieldType.renderEditor`, `RefFieldType.renderInfo`
- [x] `FieldsSidebar` — resolves from DI
- [x] `FieldEditorContext` — `getFieldType` from DI, removed `getFieldPlugin`
- [x] `FieldEditor.tsx` — uses `getFieldType` for `canAccept`/`allowLayout`
- [x] `Field.tsx` — uses `getFieldType` for icon, label, canEditSettings, renderEditor, renderInfo
- [x] `getDragInfo` + `DragPreview` — uses DI
- [x] `EditFieldDialog` — reads label from `CmsFieldType` instead of `fieldPlugin`
- [x] `getFieldRendererPlugin` → `getFieldRenderer` — resolves `CmsFieldRenderer` from DI
- [x] Fixed `<FileManager>` / `<HeadlessCMS>` registration order
- [x] `DynamicZoneTemplate` — named dialog + accordion fix
- [x] `FileFieldType` icon updated
- [ ] Manual verify: model editor sidebar, drag-and-drop, nested editors

---

## Phase 4: Remove old plugins + cleanup

### Deleted

- [x] All `admin/plugins/fieldValidators/` — reimplemented in `presentation/fieldValidators/`
- [x] Leaf field plugins from `allPlugins.ts`
- [x] `ref`, `object`, `dynamicZone` from `allPlugins.ts` (no longer registered as old plugins)
- [x] Old transformer plugins removed from registration — replaced by `CmsEntryValueTransformer` DI abstraction
- [x] `FullScreenContentEntry/` directory deleted
- [x] Dead `EditFieldDialog/` subdirectories (ValidationTab, functions, getValidators)
- [x] Dead imports from `index.tsx` (ContentEntryListConfig, ContentEntryEditorConfig)

### New abstractions created

- `CmsEntryValueTransformer` — per-field-type value transformer abstraction
- `EntryDataPreparer` — walks fields and applies transformers
- `DynamicZoneValueTransformer` — converts `{_templateId, ...}` → `{GqlTypeName: {...}}`
- `ObjectValueTransformer` — recursively prepares nested objects
- Transformers injected into gateways (`CreateEntryGateway`, `UpdateEntryGateway`, `UpdateSingletonEntryGateway`)

### Remaining old code (still needed)

- `admin/plugins/fields/object.tsx` — `render()` still used by old `ContentEntry` view (public export)
- `admin/plugins/fields/ref.tsx` — `renderSettings` still used by old field editor system
- `admin/plugins/fields/dynamicZone.tsx` — `render()` still used by old view
- `admin/plugins/fields/dynamicZone/` — components used by `DynamicZoneFieldType.renderEditor`
- `admin/plugins/fields/object/` — `ObjectFields` used by `ObjectFieldType.renderEditor`
- `admin/plugins/fields/ref/` — `renderInfo` used by `RefFieldType`
- `admin/plugins/fields/ui/` — layout field plugins (separate type)
- `admin/plugins/fieldRenderers/` — **under review for deletion**
- `admin/plugins/transformers/` — no longer registered but files still on disk
- `admin/views/contentEntries/ContentEntry/` — old view, still in routes + public exports

### Build status

- [x] `yarn build` passes
- [x] `yarn lint` clean
- [ ] Manual verification needed
