# @webiny/app-aco — Components

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This slice (`packages/app-aco/src/components`, ~6.3k lines across 124 files) is the presentation layer for ACO's folder/record UI: `FolderTree` (tree view + drag/drop + node actions), `FolderGrid`, `FolderPicker`, `Search`, `Actions` (per-folder menu items: delete/edit/set-permissions), `Table` (a fully DI-wired, MobX-presenter-backed data table with column visibility persisted to local storage), and `AdvancedSearch` (a large filter-builder sub-app with its own domain layer, presenters, and gateways). The code consistently follows the project's MVP/DI conventions (interface + implementation + factory, one per file) and correctly reuses `@webiny/admin-ui` primitives (`Tree`, `DataTable`, `OptionsMenu`, `Input`, `Tooltip`) rather than reimplementing them — no `ListCache` reimplementation was found in this slice. The main issue is that `components/FolderTree` is a near-complete duplicate implementation of the same tree-rendering logic (drag/drop, sort, node click, drop-confirmation) that also exists as a separate presenter-based rewrite in `presentation/folderTree/FolderTree.tsx` (outside this slice), both currently live and consumed independently. Test and Storybook coverage for this slice is thin: only the `AdvancedSearch` and `Table` MobX presenters have unit tests; none of the ~118 other files have tests, and there are zero `.stories.tsx` files anywhere in the slice.

## Public API
- `FolderTree`, `FolderPicker` (`FolderTree/index.tsx`, `FolderPicker/FolderPicker.tsx`) — consumed by `app-aco`'s own dialogs/pages and by `app-website-builder`'s `TranslatePageDialog`; re-exported via `packages/app-aco/src/exports/admin/ui.ts` and `packages/webiny/src/admin/ui.ts`.
- `DeleteFolder`, `EditFolder`, `SetFolderPermissions` (`Actions/*`) — registered as default folder menu actions; `EditFolder`/`DeleteFolder` each have ~8-9 cross-package callers (`app-file-manager`, `app-headless-cms`, `app-website-builder` page/redirect lists).
- `Table` (`Table/index.tsx`) — a generic, namespaced data table with persisted column visibility; consumed by `app-aco`'s own list views and reused directly by other packages (e.g. `DecoratableDataTable`, `LogsView`).
- `AdvancedSearch` / `AdvancedSearchWithFieldRenderers` (`AdvancedSearch/index.tsx`) — used by `AcoConfig.tsx` and `app-headless-cms`'s `CmsAdvancedSearch`.
- `Search` — a thin wrapper around `@webiny/admin-ui`'s `Input` with a search icon; used inside ACO list toolbars.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| — | — | — | None found. | — | — |

No confirmed bugs were found in this slice's non-test source during review. The one initially suspicious spot — `MenuActions.tsx:16` reading `folder.canManageStructure` without a null guard — is safe in practice because `FolderProvider` (`contexts/folder.tsx`) renders `null` whenever `folder` is `undefined`, so `MenuActions` (and everything else inside `FolderProvider`) never mounts with a missing folder.

## Duplication
Package-wide jscpd summary (52 clones / 764 duplicated lines across all of `@webiny/app-aco`, not just this slice) groups into a handful of recurring patterns:

1. **Folder action menu items copy-pasted three times** (this slice) — `Actions/DeleteFolder/DeleteFolder.tsx:10-29` and `Actions/EditFolder/EditFolder.tsx:10-29` are near-byte-identical (`useFolder` → `useXDialog` → guard → `<OptionsMenuItem>`), and `Actions/SetFolderPemissions/SetFolderPermissions.tsx` follows the exact same template with one extra permission check. A single parameterized `FolderMenuAction` component (icon, label, dialog hook, optional guard) would collapse all three.
2. **Two parallel Tree implementations** (spans this slice + `presentation/`) — `components/FolderTree/List/List.tsx:117-168` (sort comparator, `canDrag`, `canDrop`, `nodeRenderer`, drop-confirmation wiring, `<Tree>` JSX) is duplicated almost line-for-line in `presentation/folderTree/FolderTree.tsx:229-312`. The `components/FolderTree` version is hook-driven and used by `FolderPicker`; the `presentation/folderTree` version is presenter/MobX-driven and used only by `FolderTreeFieldRenderer`. These appear to be an old and a new implementation of the same tree UI coexisting rather than one replacing the other.
3. **AdvancedSearch presenter pairs** (this slice) — `QueryBuilderDrawer/QueryBuilderDrawerPresenter.ts` and `QuerySaverDialog/QuerySaverDialogPresenter.ts` each implement an identical `validateFilter`/`onSave` pattern (`QueryBuilderDrawerPresenter.ts:171-210` vs `QuerySaverDialogPresenter.ts:77-103`); additionally, `QueryBuilderDrawerPresenter.ts`'s own `onApply` (171-184) and `onSave` (184-197) methods have identical bodies. `FilterMapper.ts:4-20` (`toDTO`) and `FilterMapper.ts:22-37` (`toStorage`) also duplicate the same `groups.filters.map(...)` normalization logic; `FilterRepository.ts:94-108` vs `72-86` repeats the same sort-and-splice-in-place pattern for create/update.
4. **Test-file duplication** (largest share of the 764 lines, low real-world impact) — `AdvancedSearchPresenter.test.ts`, `GraphQLInputMapper.test.ts`, `QueryBuilderDrawerPresenter.test.tsx`, `UpdateFolder.test.ts`, `LoadFolderHierarchy.test.ts`, `ListFoldersByParentIds.test.ts`, `GetDescendantFolders.test.ts`/`GetFolderAncestors.test.ts` (54-line clone) all repeat near-identical assertion blocks across similar test cases; this is typical copy-pasted test setup rather than a maintenance risk.
5. **`config/folder/Action.tsx` vs `config/record/Action.tsx`** (outside this slice, `src/config/`) — flagged by the same jscpd run (24+21+12 duplicated lines) but not audited here; noted for whoever covers the `config` slice.
6. No reimplementation of admin-ui components was found — `Tree`, `DataTable`, `OptionsMenu`, `Input`, `Tooltip`, `IconButton` are all consumed as-is from `@webiny/admin-ui`/`@webiny/app-admin`. No `ListCache` copy exists in this slice (the four known copies live in `admin-ui` and `app-admin`, per their level-02/level-03 reports).

## Dead code
None confirmed within budget. `components/FolderTree/index.tsx`'s re-export of `Loader` and the `presentation/folderTree/FolderTree.tsx` duplicate (see Duplication #2) both have live callers, so neither is dead — but the coexistence itself is a maintenance smell worth resolving (pick one implementation).

## Convention issues
- `Actions/SetFolderPemissions/` (directory name, and both the folder and the barrel file) is misspelled — missing the "r" in "Permissions" (`SetFolderPemissions` vs `SetFolderPermissions.tsx`). Minor, but inconsistent with the DI/file-naming convention used everywhere else in the package.
- Everything else in this slice (Table's `ColumnVisibility`/`Columns` DI trees, `AdvancedSearch/domain`) follows the one-abstraction-per-file and `I<Name>`/`<Name>` DI naming convention cleanly — no other violations found.

## Test gaps
- Of ~124 files in this slice, only the `AdvancedSearch` presenters (`AdvancedSearchPresenter`, `GraphQLInputMapper`, `QuerySaverDialogPresenter`, `QueryBuilderDrawerPresenter`) and the `Table` DI layer (`ColumnsVisibilityPresenter`, `ColumnsPresenter`) have unit tests (6 test files total).
- `FolderTree` (including drag/drop, `canDrop`-into-descendant guard, drop-confirmation flow), `FolderPicker`, `FolderGrid`/`FolderGridItem`, `Search`, and all three `Actions/*` menu items have no tests at all.
- Zero `.stories.tsx` files exist anywhere in this slice, so none of the visual components (`FolderGridItem`, `Node`/`FolderNode`, `Search`, `Table`) have Storybook coverage.

## Recommendations
1. Consolidate the duplicated Tree implementation: decide whether `components/FolderTree` (hook-based) or `presentation/folderTree/FolderTree.tsx` (presenter-based) is the canonical one, and migrate the remaining consumer (`FolderPicker` or `FolderTreeFieldRenderer`) to it — carrying two parallel drag/drop/sort/drop-confirmation implementations is a real ongoing maintenance risk.
2. Extract the three near-identical `Actions/*` menu-item components (`DeleteFolder`, `EditFolder`, `SetFolderPermissions`) into one parameterized component, and factor the repeated `validateFilter`/`onSave` logic out of `QueryBuilderDrawerPresenter`/`QuerySaverDialogPresenter` into a shared base or helper.
3. Add unit tests (and ideally stories) for `FolderTree`'s drag/drop and drop-confirmation logic and `FolderPicker` — these are the most complex, most widely reused, and currently completely untested pieces of this slice.
