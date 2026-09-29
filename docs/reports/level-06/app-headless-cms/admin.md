# @webiny/app-headless-cms — Admin (legacy/app shell)

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

This slice covers `packages/app-headless-cms/src/admin` (~8.5k lines: `RoutesConfig`, `components`, `config`, `features`, `graphql`, `hooks`, `lexicalConfig`, `plugins`, `views`, `viewsGraphql`). It is not a dead legacy folder waiting to be deleted: it is a hybrid of (a) live, current infrastructure — `RoutesConfig` (the route registration for the CMS admin section), the `config/contentEntries` fluent config API (`ContentEntryListConfig`/`ContentEntryEditorConfig`, re-exported from the package root and used by extensions), `features/playgroundTabs`, and small hooks — and (b) an older plugin/view-based UI (the drag-and-drop `FieldEditor`, its `EditFieldDialog`, the `permissionRenderer` plugin trio, `LexicalCmsEditor`, and the `plugins/editor` toolbar registry) that predates the MobX-presenter/DI-feature pattern used in `src/presentation` and `src/features`, but has **not** been superseded by them — it is still the only implementation of content-model field editing and is directly imported by parts of `src/presentation` (see Duplication/Dead code). The most valuable finding is that the "field rules/permissions" editing UI now exists twice: once in this slice's legacy `EditFieldDialog` (`RulesEditor`, `PermissionsEditor`) and once in `src/presentation/fieldEditor/renderers` (`CmsConditionRulesRenderer`, `CmsAccessControlRulesRenderer`), with up to 37 near-identical lines (confirmed by jscpd and by reading both), because only some field types were migrated to the new renderer-plugin mechanism while layout-type fields (Alert/Tabs/Separator/DynamicZone) still use the old dialog. There are zero automated tests anywhere in this slice.

## Public API

- `RoutesConfig` (`admin/RoutesConfig.tsx`) — registers the CMS admin routes (content model groups list, content entries list, content model editor, content models list) via `AdminConfig`/`AdminLayout`/`SecureRoute`; consumed once, from `src/HeadlessCMS.tsx`.
- `ContentEntryListConfig` / `ContentEntryEditorConfig` (`admin/config/contentEntries`) — fluent extension API for customizing the entries list/editor; re-exported from the package's top-level `index.tsx` for use by other apps/extensions (per `app-headless-cms-common`'s summary, consumed across `app-file-manager`, `app-aco`, `app-website-builder`, `webiny`).
- `ContentModelEditor` (`admin/views/contentModels/ContentModelEditor.tsx`) — the sole UI for editing a content model's field tree; lazy-loaded by `RoutesConfig`.
- `FieldEditor` + `Draggable`/`Droppable`/`DropZone`/`DragPreview` (`admin/components/FieldEditor`, `admin/components/{Draggable,Droppable,DropZone,DragPreview}.tsx`) — the drag-and-drop field-arrangement engine; reused directly by `src/presentation/fieldTypes` (layout field types: `SeparatorLayoutFieldType`, `AlertLayoutFieldType`, `TabsLayoutEditor`, `ObjectFields`, `DynamicZoneTemplate`) and by `src/presentation/fieldEditor/renderers/CmsAccessControlRulesRenderer.tsx`.
- `EditFieldDialog` (`admin/components/FieldEditor/EditFieldDialog.tsx`, plus `RulesEditor`/`PermissionsEditor`) — legacy per-field settings dialog; still the only field-settings UI for layout-type fields.
- `permissionRenderer` plugin (`ContentModelPermission`/`ContentModelGroupPermission`/`ContentEntryPermission`) — registers the CMS security-roles-screen renderer via `CmsSecurityPermission`, wired once in `src/HeadlessCMS.tsx`.
- `LexicalEditorCmsPlugin` (`admin/components/LexicalCmsEditor`) — wires CMS-specific behaviour into the shared Lexical rich-text editor; registered in `src/HeadlessCMS.tsx`.
- `CmsPlaygroundTabsFeature` (`admin/features/playgroundTabs`) — registers GraphQL Playground tabs for the read/manage/preview APIs; registered in `src/HeadlessCMS.tsx`.
- `admin/components/ContentEntries/*` (`BulkActions`, `Table/Cells`, `Table/Actions`, `FilterByStatus`) — consumed by the current `src/ContentEntriesModule.tsx`, not legacy despite the folder location.
- `admin/components/Dialogs/*ConfirmDialog` (Publish/Unpublish/Trash/DeleteRevision) — consumed by `src/ContentEntriesModule.tsx`; each deep-imports `@webiny/app-admin/components/ConfirmationDialog/index.js` directly rather than through `@webiny/app-admin`'s public barrel (see Convention issues).
- `admin/hooks/*` (`usePermission`, `useIsModelPublishable`, `useEntry`) — small utility hooks, referenced ~49 times, mostly within this package.
- `admin/plugins/index.ts` (`icons`, `defaultBar`, `formSettings`) — the legacy `plugins.register()`-based toolbar/settings-panel registry for the model editor, registered via `headlessCmsPlugins()` in `src/HeadlessCMS.tsx`.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| — | — | — | None found. | — | — |

No confirmed functional bugs were found while reading this slice (`RoutesConfig`, the `permissionRenderer` trio, the `ContentEntries` dialogs/actions, `useEntry`, `views/utils.ts`). The `permissionRenderer` trio (`ContentModelPermission`/`ContentModelGroupPermission`/`ContentEntryPermission`) is structurally duplicated (see Duplication) but each copy is correctly parameterized by its own `entity`/`endpoints`, so no copy-paste defect was confirmed.

## Duplication

- `admin/components/FieldEditor/EditFieldDialog/RulesEditor/RulesEditor.tsx` (33–76) duplicates `src/presentation/fieldEditor/renderers/CmsConditionRulesRenderer.tsx` (94–139) — up to 12 identical lines per jscpd; both implement the same condition-rules list-editor UI, one for layout-type fields (via the legacy dialog) and one for regular fields (via the new renderer-plugin registration in `HeadlessCMS.tsx`'s `AdminConfig.Form.FieldRenderer name="cmsConditionRules"`).
- `admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/PermissionsEditor.tsx` (19–27) duplicates `src/presentation/fieldEditor/renderers/CmsAccessControlRulesRenderer.tsx` (26–34) — same pattern as above, for access-control rules.
- `admin/plugins/permissionRenderer/components/{ContentModelPermission,ContentModelGroupPermission,ContentEntryPermission}.tsx` — a three-way near-duplicate (12–37 identical lines pairwise per jscpd) of the same "access scope / primary actions / publishing actions" permission editor, parameterized by permission level (group/model/entry) instead of extracted into one shared component with a `level` prop.
- `admin/config/contentEntries/list/Browser/{Filter.tsx,BulkAction.tsx,SidebarFooter.tsx}` and `admin/config/contentEntries/editor/Actions/BaseAction.tsx` — a small (8–30 line) snippet repeated 3–4 times per jscpd, all variants of the same dropdown-menu-item boilerplate.
- `admin/components/ContentEntries/Table/Cells/{CellLive.tsx,CellStatus.tsx}` — 10-line clone (status-badge rendering logic).
- `admin/plugins/editor/formSettings/components/GeneralSettings.tsx` (18–38) — a minor self-duplicate: three near-identical disabled `<Input>` blocks (`modelId`, `singularApiName`, `pluralApiName`); cosmetic, not worth a dedicated fix on its own but adds to the picture of copy-pasted form boilerplate already flagged in `admin-ui`'s and `app-admin`'s reports.
- `admin/components/LexicalCmsEditor/LexicalEditorCmsPlugin.tsx` (50–58) — an 8-line internal near-clone (adjacent branches), low value.

None of the reused lower-level utilities documented in dependency summaries (admin-ui's `ListCache`, `@webiny/utils`'s `generateId`, `cms-sdk`'s `refUtils`) are reimplemented in this slice.

## Dead code

- No dead files were confirmed. Several files that looked orphaned at first grep (`admin/components/Dialog.tsx`, `admin/views/utils.ts`) turned out to be consumed via relative imports from `src/presentation/contentModels/components/*` (`Dialog`) and `src/presentation/{contentModels,modelGroup}/components/*DataList.tsx` (`deserializeSorters`) — a reminder that this slice's exports leak into `presentation/` more than the folder split suggests, reinforcing the "not actually legacy-vs-new, but tangled" summary above.
- `admin/components/FieldEditor`, `admin/components/{Draggable,Droppable,DropZone,DragPreview}.tsx`, and `admin/plugins/editor` all looked like they had zero cross-slice consumers on a naive path grep, but are used via relative imports from within `FieldEditor.tsx`/`FieldEditorContext.tsx` and are registered through `admin/plugins/index.ts` → `headlessCmsPlugins()` → `HeadlessCMS.tsx`. No dead code confirmed here either.

## Convention issues

- `admin/components/Dialogs/{PublishEntryConfirmDialog,UnpublishEntryConfirmDialog,TrashEntryConfirmDialog,DeleteRevisionConfirmDialog}.tsx` import `ConfirmationDialog` via `@webiny/app-admin/components/ConfirmationDialog/index.js` — a deep import into `app-admin`'s internal path. `app-admin`'s own `components/index.ts` barrel does not export `ConfirmationDialog` (only `app-admin`'s `exports/admin/ui.ts` sub-path does), so this is a real bypass of the intended public surface, matching the deep-import noted in the level-3 `app-admin` audit; it works today but is brittle if `app-admin` reorganizes its internal `components/` tree.
- This slice predates the DI abstraction/implementation-per-file convention used elsewhere in the codebase (it's built on `plugins.register()` and ad hoc React context/hooks instead); that's expected for code of this vintage and not something to "fix" in place, but it means new CMS admin features should be added to `src/features`/`src/presentation`, not to `src/admin`, to avoid growing the legacy surface further.

## Test gaps

- Zero test files exist anywhere under `packages/app-headless-cms/src/admin` (confirmed: the package's only 4 `*.test.ts` files are all in `src/presentation` and `src/features`). Untested and functionally significant: the `FieldEditor` drag-and-drop reordering logic, the `permissionRenderer` access-scope cascading logic (`ContentEntryPermission`'s effect that forces `own` scope when the parent content-model scope is `own`), `RoutesConfig`'s route wiring, and all of `config/contentEntries` (list/editor extension config consumed by other packages).

## Recommendations

1. Reconcile the duplicated rules/permissions editing UI: either migrate the remaining layout-type fields (`Alert`/`Tabs`/`Separator`/`DynamicZone`) off the legacy `EditFieldDialog`'s `RulesEditor`/`PermissionsEditor` onto the shared `CmsConditionRulesRenderer`/`CmsAccessControlRulesRenderer` renderer plugins, or explicitly document why the split exists — right now a rules-editing bug fix is likely to be applied to only one of the two copies.
2. Fix the `ConfirmationDialog` deep imports in `admin/components/Dialogs/*` to go through `app-admin`'s public `exports/admin/ui` surface instead of `@webiny/app-admin/components/ConfirmationDialog/index.js`.
3. Add at least presenter/logic-level tests for `FieldEditor`'s drag-and-drop reordering and `ContentEntryPermission`'s access-scope cascade before either is touched again — both are reachable from every content model in the product and currently have zero coverage.
