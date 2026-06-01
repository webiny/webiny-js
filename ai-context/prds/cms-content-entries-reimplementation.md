# PRD: CMS Content Entries Reimplementation with DI Architecture

## Problem Statement

The CMS content entries module (`packages/app-headless-cms/src/admin/views/contentEntries`) has three fundamental architectural problems:

1. **ApolloClient coupling**: All data fetching goes through ApolloClient with manual cache management, while the rest of the platform has moved to the WebinySdk + Gateway/Repository/UseCase pattern with MobX-based caching.

2. **Custom form rendering stack**: CMS maintains its own form rendering system — `@webiny/form` Form component, plugin-based field renderers (`cms-editor-field-renderer`), and a custom `ContentEntryFormProvider` — when the platform now has FormModel (`app-admin/features/formModel`), a declarative, MobX-powered form system with a standard renderer architecture.

3. **Route coupling**: The module hardcodes `Routes.ContentEntries.List` in 6+ files for model loading, entry selection, folder navigation, and revision switching. This makes it impossible to mount the same CMS entry list/form on a custom route (e.g., `/tenant-manager`) without forking the entire module.

These issues result in duplicated abstractions, untestable context hierarchies, and an inability to reuse the CMS entry UI outside the CMS route.

## Solution

Completely rewrite the content entries module using the DI-powered architecture established by the File Manager (`app-file-manager/src`) and Website Builder redirects (`app-website-builder/src/presentation/redirects`):

- **Data layer**: Replace ApolloClient with WebinySdk-backed features (Gateway → Repository → UseCase) and a shared `ListCache<ContentEntry>` for MobX-based caching.
- **Form rendering**: Replace the CMS form stack with FormModel. A `CmsFormModelBuilder` maps any `CmsModel` to a `FormModelConfig` at runtime. The CMS no longer provides its own renderers or rendering logic — it maps CMS field "Appearance" config to FormModel renderer names.
- **Presenters**: MobX-based `ContentEntriesPresenter` (list) and `ContentEntryFormPresenter` (form) own all state. No React context chains.
- **Route-agnostic**: `ContentEntriesView` accepts `modelId` as a prop. Entry/folder selection is observable presenter state, not URL state. An optional URL sync adapter enables deep-linking for the default CMS route.

## User Stories

1. As a developer, I want to mount a full CMS entry list/form on any route by providing just a `modelId`, so that I can build custom admin modules (e.g., `/tenant-manager`) backed by CMS models without duplicating code.
2. As a developer, I want the CMS entry form to use FormModel, so that form rendering, validation, layout, and field interaction follow the same patterns as the rest of the platform.
3. As a developer, I want CMS data fetching to go through WebinySdk and headless features, so that I can mock, test, and extend data operations without touching Apollo or GraphQL directly.
4. As a developer, I want CMS entry CRUD operations (create, update, publish, unpublish, delete) to be UseCase features with proper cache invalidation, so that all views stay synchronized after mutations.
5. As a developer, I want to register a custom CMS field type and have it automatically work in the FormModel-based form, so that I can extend the CMS without understanding FormModel internals.
6. As a developer, I want the content entries list to use ListPresenter + DataSource + FolderTreePresenter (same as File Manager), so that list behavior (pagination, sorting, filtering, folder navigation) is consistent across the platform.
7. As a developer, I want bulk actions (publish, unpublish, move, delete) to be proper UseCase features with cache updates, so that the list reflects changes immediately.
8. As a developer, I want singleton content entries to work with the same FormModel-based form, so that singleton rendering is consistent with regular entry rendering.
9. As a developer, I want presenter-level dirty state tracking and navigation guards, so that users don't lose unsaved changes.
10. As a developer, I want the CMS model's "Appearance" field configuration to continue working — selecting a renderer for a field in the model editor should produce the correct FormModel renderer at runtime.
11. As a developer, I want the configurable component system (`ContentEntryListConfig`, `ContentEntryEditorConfig`) to continue working, so that existing customizations are not broken.
12. As a developer, I want reference field renderers (autocomplete, simple, detailed — single and multiple) to work as FormModel renderers registered from the CMS package, so that ref fields render correctly without CMS-specific rendering logic in FormModel.
13. As a developer, I want the CMS `FieldRule` system (condition-based hide/disable, access control rules) to map to FormModel's rules system, so that field visibility and disability work as before.
14. As a developer, I want dynamic zones (templated object fields) to map to FormModel's template system, so that dynamic zone rendering uses the standard FormModel object/template composition.
15. As a developer, I want all CMS validation rules to map to Zod schemas on FormModel fields, so that validation behavior is preserved without a separate validation system.
16. As a user, I want entry creation, editing, publishing, and unpublishing to work identically to today — no behavior regressions.
17. As a user, I want folder navigation, search, and filtering to work identically to today.
18. As a user, I want revision management (create revision, switch revision, view revision list) to work identically to today.
19. As a user, I want bulk actions on multiple entries to work identically to today.
20. As a user, I want singleton content entries (single-instance models) to work identically to today.

## Implementation Decisions

### Architecture Layers

The module follows the same layered architecture as the File Manager:

```
View Layer (React observer) → Presenter (MobX) → UseCase → Repository → Gateway → WebinySdk
```

Each layer has a single responsibility. Views observe presenters. Presenters compose child presenters and use cases. Use cases orchestrate repositories. Repositories manage cache. Gateways call the SDK.

### Feature Modules

Each CRUD operation is its own feature with Gateway/Repository/UseCase, following the pattern in `app-file-manager/src/features/`. Features: getEntry, listEntries, createEntry, updateEntry, publishEntry, unpublishEntry, deleteEntry, createRevisionFrom, listRevisions, getSingletonEntry, updateSingletonEntry, bulkPublish, bulkUnpublish, bulkMove, bulkDelete.

All mutating features update a shared `ContentEntriesListCache` (singleton `ListCache<ContentEntry>`) so the list stays synchronized.

### SDK Method Gaps

`packages/sdk/src/methods/cms/` is missing: `createRevisionFrom`, `listRevisions`, `getSingletonEntry`, `updateSingletonEntry`, `bulkAction`. These must be added following the existing SDK method pattern before the Gateway layer can be built.

### CmsModel → FormModel Mapping

A `CmsFormModelBuilder` converts any `CmsModel` to a `FormModelConfig` at runtime:

- **Field types**: text→text, long-text→text, number→number, boolean→boolean, datetime→dateTime, file→file, rich-text→lexical, object→object (recursive), dynamicZone→object with templates, ref→new CMS-specific field type, json→text with code editor renderer.
- **Layout**: CMS 2D layout arrays → FormModel layout nodes (rows, tabs, separators, alerts, nested objects).
- **Validation**: CMS validators → Zod schemas on field builders.
- **Renderers**: CMS `field.renderer.name` → FormModel renderer name via a static mapping table.
- **Rules**: CMS `FieldRule` maps directly to FormModel `IRule` (same shape). Access control rules need a CMS-specific evaluator.
- **Predefined values**: `field.predefinedValues.enabled` → `.options()` on the field builder.

### Extensible Field Type Registry

`CmsFormModelBuilder` uses a registry of `IFieldTypeMapper` implementations. Each mapper handles one CMS field type. Custom CMS field types register their own mapper via the DI container. Unknown types fall back to a passthrough renderer.

### Reference Field Type

FormModel has no `ref` field type. A new `CmsRefFieldType` (`IFieldTypeFactory`) is registered from the CMS package. Six ref renderers (autocomplete single/multi, simple single/multi, detailed single/multi) are ported from plugin format to `createFieldRenderer()` format and registered in admin config. They use DI-resolved use cases for searching referenced entries.

### List Presenter

`ContentEntriesPresenter` composes `ListPresenter<ContentEntry>` (from `app-admin`) and `FolderTreePresenter` (from `app-aco`). A `ContentEntriesDataSource` bridges the ListPresenter's query interface to `ListEntriesUseCase`, handling CMS-specific where-clause building.

Init: `presenter.init({ modelId, initialFolderId? })`. Entry selection is an observable state change (`actions.selectEntry(id)` → `vm.selectedEntryId`), not a route navigation.

### Form Presenter

`ContentEntryFormPresenter` loads or creates an entry, constructs a FormModel from the CmsModel via `CmsFormModelBuilder`, populates it with entry data, and exposes CRUD actions (save, publish, unpublish, delete, createRevision). Dirty state delegates to `formModel.isDirty`.

The form view renders `<FormView form={vm.form} />` from `app-admin`. No CMS-specific rendering logic.

### Route-Agnostic Mounting

`ContentEntriesView` accepts `modelId` as a prop. It creates a scoped DI child container, registers all features, and initializes the presenter. Entry/folder selection lives in presenter state, not URL params.

An optional `urlSync` adapter bridges presenter state ↔ URL params for the default CMS route. Custom routes (e.g., `/tenant-manager`) work without it — just `<ContentEntriesView modelId="tenant" />`.

### ACO Integration

Same approach as File Manager: `FoldersFeature` and `FolderTreePresenterFeature` from `@webiny/app-aco` are imported and registered in the scoped container. No ACO React hooks or providers.

### Configurable Components

`ContentEntryListConfig` and `ContentEntryEditorConfig` are preserved as-is. Views read config from the config context alongside presenter VM. Public API unchanged.

### Singleton Entries

A simplified `SingletonEntryPresenter` — no revisions, no create/delete, auto-loads the singleton, only save. Reuses `CmsFormModelBuilder` for form construction.

## Testing Decisions

Good tests verify external behavior (input → output, state transitions), not implementation details. They mock at layer boundaries (e.g., mock Gateway to test UseCase) and assert observable outcomes (cache state, VM state, rendered output).

### Modules to test:

- **CmsFormModelBuilder** (most critical) — given a CmsModel definition, verify the produced FormModelConfig: every CMS field type maps to the correct FormModel field type, layouts map correctly, validations produce correct Zod schemas, predefined values produce options, rules map, nested objects and dynamic zones work.
- **CmsValidationMapper** — each CMS validator produces the correct Zod schema.
- **CmsLayoutMapper** — 2D arrays + tabs + separators + alerts produce correct FormModel layout nodes.
- **UseCase features** — mock Gateway, verify Repository cache updates, verify UseCase error handling. Follow `ListFiles.test.ts` pattern from File Manager.
- **Presenter tests** — mock UseCases, verify VM state transitions (loading → loaded, select entry → showingEntry, save → saving → saved). Follow `FileListPresenter.test.ts` pattern.
- **Route-agnostic mount** — mount `ContentEntriesView` with just `modelId` prop (no route context), verify full list/form/CRUD cycle.

### Prior art:
- `packages/app-file-manager/src/presentation/FileList/FileListPresenter.test.ts`
- `packages/app-file-manager/src/features/listFiles/ListFiles.test.ts`
- `packages/app-admin/src/features/formModel/FormModel.test.ts`

## Out of Scope

- **Content model editor**: The model editor (where you define fields, layout, appearance) is not being rewritten. Only the content entry list and form are in scope.
- **Backend changes**: No API or schema changes. The SDK methods produce the same GraphQL queries.
- **ACO reimplementation**: ACO's DI-based features (`FoldersFeature`, `FolderTreePresenterFeature`) already exist and are reused as-is.
- **FormModel core changes**: FormModel itself is not modified. The CMS extends it with a `ref` field type and CMS-specific renderers, but the FormModel core is stable.
- **Migration tooling**: No automated migration for users who have extended the CMS entry UI via plugins. The configurable component API is preserved, but raw plugin-based field renderer customizations will need manual porting to `createFieldRenderer()` format.

## Further Notes

- **File field rendering**: `filePicker` for single file, `multiFilePicker` for file list (gallery).
- **Phased delivery**: The implementation should be phased — SDK methods and features first (no UI changes), then mapping layer, then presenters, then views, then cleanup. Each phase can be verified independently.
- **Reference**: The File Manager (`app-file-manager/src`) is the primary architectural reference. The Website Builder redirects (`app-website-builder/src/presentation/redirects`) is a secondary reference for the list presenter pattern.
