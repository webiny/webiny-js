# @webiny/app-headless-cms-common

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-headless-cms-common` is a tiny, pure-TypeScript-types package: it has no runtime logic beyond one type-guard function (`isLayoutField`) and one string constant (`CMS_MODEL_SINGLETON_TAG`). Everything else is shared interface/type declarations for the headless-CMS content model and content-entry shape (`CmsModel`, `CmsModelField`, `CmsEditorFieldsLayout`, `CmsContentEntry`, `CmsContentEntryRevision`, `CmsGroup`, plugin interfaces such as `CmsIconsPlugin`/`CmsFieldValueTransformer`/`CmsContentFormRendererPlugin`) that the whole admin CMS ecosystem (`app-headless-cms`, `app-file-manager`, `app-aco`, `app-headless-cms-workflows`, `app-headless-cms-scheduler`, `app-scheduler`, `app-website-builder`, `webiny`) imports instead of redefining these shapes locally. Overall health is good — there is no logic to break — but there is a real, verifiable interface duplication and one apparently-dead export barrel.

## Public API
- `CmsModel`, `CmsModelField`, `CmsEditorFieldsLayout`, `CmsLayoutField`, `isLayoutField` (`types/model.ts`) — the content-model/layout shape; consumed widely, e.g. `app-headless-cms/src/presentation/contentEntries/views/FieldsMapper.ts`, `app-aco/src/features/folders/*`, `app-file-manager/src/modules/HeadlessCms/fieldType/*` (~10+ packages, dozens of files).
- `CmsContentEntry`, `CmsContentEntryRevision`, `CmsIdentity`, `CmsErrorResponse`, `CmsMetaResponse`, `BindComponent` (`types/shared.ts` and `types/index.ts`) — consumed by `app-headless-cms`, `app-headless-cms-workflows`, `app-scheduler`, `app-website-builder`, `app-aco`.
- `CmsIconsPlugin`, `CmsFieldValueTransformer`, `CmsContentFormRendererPlugin`, `CmsEditorFormSettingsPlugin`, `CmsEntryFilterStatusPlugin` — plugin-registration interfaces, consumed by icon/field-renderer/form-settings plugin authors across the same packages.
- `CMS_MODEL_SINGLETON_TAG` (`constants.ts`, re-exported from `index.ts`) — consumed where singleton-content-model handling is needed.
- `exports/admin/cms.ts` — a barrel re-exporting `CmsContentEntry`, `CmsModel`, `CmsModelField`, `CmsModelLayoutField`, `CmsIdentity`; no in-repo importers found (see Dead code).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| — | — | — | None found. | The package is almost entirely type declarations; the one runtime function, `isLayoutField` (`types/model.ts:117-125`), correctly matches its documented discriminator logic (an object with `type` but without `fieldId`). | — |

## Duplication
- `CmsIconsPlugin` is declared identically in two files: `src/types/shared.ts:10-13` and `src/types/index.ts:194-197` (same three members: `id`, `name`, `svg`... actually `type`/`getIcons()` shape, byte-identical). `types/index.ts:25` also does `export type * from "./shared.js"`, so `shared.ts`'s copy is re-exported under the same name that `types/index.ts` re-declares locally — for anyone importing from `types/index.js` (or the `types.js` subpath alias) the local declaration silently wins, while `types/shared.js` remains independently importable (via the package's `"./*"` exports map) and yields the same interface under a second path. This is dead duplication that should be collapsed to a single declaration in `shared.ts` with `index.ts` re-exporting it.
- No jscpd-detected clones inside the package (report shows 0 duplicates), and no logic is reimplemented from lower-level dependencies (`@webiny/form`, `@webiny/plugins`, `@webiny/validation`, `@webiny/admin-ui`, `@webiny/app`, `@webiny/app-admin` are all only referenced via `import type`, never reimplemented).

## Dead code
- `src/exports/admin/cms.ts` — a repo-wide grep for `app-headless-cms-common/exports/admin/cms` across every `packages/**/*.ts(x)` file returns zero hits; every one of the ~45 files across the monorepo that imports from this package imports from the package root (`@webiny/app-headless-cms-common`) or `.../types.js` directly, never from this barrel. High confidence it is unused within this monorepo (it may still exist to give external plugin authors a stable admin-facing import path, so removal should be a deliberate decision, not treated as pure cleanup).

## Convention issues
- The duplicate `CmsIconsPlugin` declaration above is the only meaningful issue; it isn't a DI-pattern violation (there's no DI code in this package) but it does violate the spirit of "one definition per concept" and makes it easy for the two copies to drift.
- No inline-type violations of note: the couple of large inline object types (e.g. `CmsModel.settings`/`metadata`) are pre-existing GraphQL-shaped types rather than new inline types introduced carelessly.

## Test gaps
- The package has no `__tests__` directory at all. The one non-trivial piece of logic, `isLayoutField`, has no unit test covering its three cases (string cell, `CmsModelField`-shaped cell, layout-field-shaped cell).

## Recommendations
1. Collapse the duplicate `CmsIconsPlugin` interface to a single declaration in `types/shared.ts` (or `types/model.ts`, wherever it conceptually belongs) and have `types/index.ts` rely purely on its wildcard re-export.
2. Confirm whether `exports/admin/cms.ts` is still needed for any external/downstream consumer; if not, deprecate it rather than leaving an unreferenced barrel to maintain.
3. Add a small unit test for `isLayoutField`'s three branches, since higher-level packages (e.g. `app-headless-cms`'s field editor and form renderer) depend on it to correctly distinguish layout cells from field cells.
