# Plan: Reusable ListView Compound Component

> Source PRD: `ai-context/prds/reusable-list-view-component.md`

## Context

Every admin list view (Redirects, FileManager, Pages) repeats identical layout boilerplate: SplitView sidebar, header with search/filters/actions, bulk action bar, scrollable content with loadMore, bottom info bar. The only differences are domain-specific (what the sidebar contains, what actions exist, how create/edit works). This component goes in `@webiny/app-admin` and eliminates ~200 lines per module.

## Architectural decisions

- **Location**: `packages/app-admin/src/components/ListView/`
- **Context**: `ListView` provides `{ list: IListViewModel, actions: IListActions, showingFilters, onToggleFilters }` via React context. Domain-specific state (folders, dialogs) stays in the domain presenter context.
- **Composition via named props, not children**: All layout regions (sidebar, header, content, bulkActions, filters, bottomBar) are passed as **named props** on the root `<ListView>` component. No child detection, no `React.Children` inspection. Named props are typeable with TypeScript and unambiguous to parse.
- **Layout detection**: `ListView` accepts an optional `sidebar` prop. When present, wraps in `SplitView` + `LeftPanel` + `RightPanel`. When absent, single-column layout.
- **Dependency direction**: `app-admin` does NOT depend on `app-aco`. The `ListView.Table` bridge is a hook (`useListViewTableProps`) that produces props compatible with the ACO `Table` — consumers spread these onto `<AcoTable>` themselves.
- **Standard cells**: Live in `app-aco` (where `useTableRow` / `TableRowContext` lives). Exported from `@webiny/app-aco`.
- **Existing components reused**: `SplitView`, `LeftPanel`, `RightPanel`, `FiltersToggle`, `Filters`, `Buttons`, `Scrollbar`, `DelayedOnChange`, `Input`, `EmptyView` — all already in `app-admin` or `admin-ui`.

---

## Phase 1: Foundation + Sidebar + Header + BottomBar + Redirects Migration (Tracer Bullet) [x]

**Goal**: Build the core compound component skeleton and migrate Redirects layout to prove the pattern end-to-end.

### What to build

**In `packages/app-admin/src/components/ListView/`:**

1. **`types.ts`** — `ListViewContextValue` interface wrapping `IListViewModel<any>`, `IListActions`, `showingFilters: boolean`, `onToggleFilters?: () => void`.

2. **`context.ts`** — React context + `useListView()` hook with missing-provider guard.

3. **`ListView.tsx`** — Root component. All layout regions are **named props**:
   - `list: IListViewModel<any>` — view model
   - `actions: IListActions` — actions
   - `showingFilters?: boolean`
   - `onToggleFilters?: () => void`
   - `namespace: string` — SplitView localStorage key (e.g., `"wb/redirect/list"`)
   - `sidebar?: ReactNode` — content for `LeftPanel`. When present, uses `SplitView`. When absent, single-column.
   - `header?: ReactNode` — rendered via `ListView.Header` helper
   - `bulkActions?: ReactNode` — rendered via `ListView.BulkActions` helper
   - `filters?: ReactNode` — rendered via `ListView.Filters` helper
   - `content: ReactNode` — rendered via `ListView.Content` helper (scrollable area)
   - `bottomBar?: ReactNode` — rendered via `ListView.BottomBar` helper

   Provides context. Composes layout: `SplitView(LeftPanel(sidebar), RightPanel(header + bulkActions + filters + content + bottomBar))`.

4. **`ListViewSidebar.tsx`** — Container component. Props: `title?: string`, `children`. Renders `flex flex-col h-main-content` with optional `Heading` + `Separator`. Includes `Sidebar.Section` sub-component for flex layout (props: `grow?: boolean`, `maxHeight?: string`, `scrollable?: boolean`).

5. **`ListViewHeader.tsx`** — Single component with **named props** for each section:
   - `title: { icon: ReactElement; text?: string; after?: ReactNode }` — Renders icon + heading (or Skeleton when text is undefined).
   - `search?: { placeholder?: string; id?: string; disabled?: boolean } | true` — Observer. Reads `list.search` / `actions.search` from context. `true` uses defaults.
   - `filtersToggle?: boolean` — Observer. Reads `showingFilters` / `onToggleFilters` from context. Wraps existing `FiltersToggle`.
   - `actions?: ReactNode` — Slot for custom buttons (e.g., create folder, create redirect). Renders in `flex gap-sm`.

6. **`ListViewBottomBar.tsx`** — Sticky bottom bar with `Separator`. **Named props** for each section:
   - `meta?: { itemLabel: string }` — Observer. Reads `list.pagination` from context. Renders "Showing X out of Y {label}s."
   - `status?: { loadingText?: string } | true` — Observer. Reads `list.pagination.loadingMore`. Renders spinner + text. `true` uses defaults.

7. **`index.ts`** — Compound component assembly. Exports `ListView` with all sub-components as static properties.

**In `packages/app-website-builder/` (Redirects migration):**

- Rewrite `DocumentList.tsx` to use `<ListView>` with named props. Example shape:
  ```tsx
  <ListView
      list={vm.list}
      actions={actions}
      namespace="wb/redirect/list"
      showingFilters={vm.showingFilters}
      onToggleFilters={...}
      sidebar={
          <ListView.Sidebar title="Redirects">
              <ListView.Sidebar.Section grow>
                  <FolderTree vm={vm.folders} actions={actions.folders} ... />
              </ListView.Sidebar.Section>
          </ListView.Sidebar>
      }
      header={
          <ListView.Header
              title={{ icon: <HomeIcon />, text: "Home" }}
              search={{ placeholder: "Search..." }}
              filtersToggle
              actions={<ButtonsCreate ... />}
          />
      }
      content={...existing Table + Empty for now...}
      bottomBar={
          <ListView.BottomBar
              meta={{ itemLabel: "redirect" }}
              status
          />
      }
  />
  ```
- Delete: `Layout/Layout.tsx`, `Header/Header.tsx`, `Header/Title.tsx`, `Header/Search.tsx`, `Header/ButtonFilters.tsx`, `BottomInfoBar/BottomInfoBar.tsx`, `BottomInfoBar/ListMeta.tsx`, `BottomInfoBar/ListStatus.tsx`.
- Keep: `Header/ButtonsCreate.tsx` (passed to header actions), `Main/Main.tsx` (simplified), `Table/`, `BulkActions/`, `Filters/`, `Empty/`, `Sidebar/Sidebar.tsx` (simplified — just FolderTree content, no layout chrome).

### Acceptance criteria

- [ ] `useListView()` returns context inside `<ListView>`, throws outside
- [ ] Redirects list renders with SplitView sidebar + header (title, search, filters toggle, create buttons) + bottom bar from `ListView.*`
- [ ] Visual parity with current Redirects layout
- [ ] ~8 files deleted from Redirects module

### Key files to modify

- Create: `packages/app-admin/src/components/ListView/*.tsx`
- Modify: `packages/app-website-builder/.../RedirectList/components/DocumentList.tsx`
- Delete: `Layout/`, `Header/Header.tsx`, `Header/Title.tsx`, `Header/Search.tsx`, `Header/ButtonFilters.tsx`, `BottomInfoBar/`

---

## Phase 2: BulkActions + Filters + Content (scroll-to-loadMore) + Empty [x]

**Goal**: Complete the content area sub-components and finish the Redirects migration (except Table bridge).

### What to build

**In `packages/app-admin/src/components/ListView/`:**

1. **`ListViewBulkActions.tsx`** — Observer. Props: `itemLabel: string`, `itemLabelPlural?: string`, `actions: BulkActionConfig[]`. Reads `list.selection` from context. Renders selection count + `<Buttons actions={...}>` + deselect `IconButton`. Hidden when `selectedCount === 0`. Passed as `bulkActions` prop to `<ListView>`.

2. **`ListViewFilters.tsx`** — Observer. Props: `filters: FilterConfig[]`, `filtersToWhere?: FiltersToWhereConverter[]`. Reads `showingFilters` and `actions.filter` from context. Wraps existing `<Filters>` from `app-admin`. Applies `filtersToWhere` converters before dispatching to `actions.filter.set`. Passed as `filters` prop to `<ListView>`.

3. **`ListViewContent.tsx`** — Scrollable wrapper. Props: `loadMoreThreshold?: number` (default 0.8), `loadMoreDebounceMs?: number` (default 200), `empty?: ReactNode`, `searchEmpty?: ReactNode`, `children: ReactNode`. Wraps children in `<Scrollbar>`. Debounced `onScrollFrame` calls `actions.loadMore()` when threshold exceeded. Handles empty state logic internally: when `list.empty` is true, renders `empty`; when `list.emptyWithFilters` is true, renders `searchEmpty`; otherwise renders `children`. Passed as `content` prop to `<ListView>`.

   This merges `ListViewContent` + `ListViewEmpty` into a single component since the empty state is always inside the content area.

**In Redirects:**

- Rewrite `Main.tsx` — remove BulkActions, Filters, Scrollbar, Empty conditional logic. These now come from `ListView.*` sub-components.
- Delete: `BulkActions/BulkActions.tsx` (the UI wrapper — keep `BulkActionDelete.tsx` and `BulkActionMove.tsx` as they are domain-specific actions registered via config), `Filters/Filters.tsx`.
- Keep: `Empty/Empty.tsx` (domain-specific empty state), `Filters/FilterByStatus.tsx` (domain-specific filter), `Table/Table.tsx`.

### Acceptance criteria

- [ ] Redirects uses `ListView.BulkActions`, `ListView.Filters`, `ListView.Content` (with built-in empty state handling)
- [ ] Scroll-to-loadMore works identically (debounced, 80% threshold)
- [ ] Bulk action bar shows/hides based on selection, with correct label
- [ ] Filters toggle shows/hides filter panel
- [ ] Empty state renders correctly (search empty vs default empty)
- [ ] `Main.tsx` reduced to just composing `ListView.*` sub-components

### Key files to modify

- Create: `ListViewBulkActions.tsx`, `ListViewFilters.tsx`, `ListViewContent.tsx`
- Modify: `Main.tsx` → simplified or deleted (content moves to `DocumentList.tsx`)
- Delete: `BulkActions/BulkActions.tsx`, `Filters/Filters.tsx`

---

## Phase 3: ListView.Table Bridge + Standard Cells [x]

**Goal**: Extract the Table bridge hook and standard cells. Eliminate the per-module table adapter and duplicated cell components.

### What to build

**In `packages/app-admin/src/components/ListView/`:**

1. **`ListViewTable.tsx`** — Exports `useListViewTableProps(options)` hook. Options: `{ namespace: string, nameColumnId?: string }`. Returns `{ sorting, onSortingChange, onSelectRow, selected, loading }` computed from `useListView()` context. This maps `IListViewModel.sort` → `[{ id, desc }]` and `onSortingChange` → `actions.sort.set()`, etc.

**In `packages/app-aco/` (standard cells):**

2. **`src/components/Table/cells/CellAuthor.tsx`** — Reads `row.data.createdBy.displayName` from `TableRowContext`.
3. **`src/components/Table/cells/CellCreated.tsx`** — Reads `row.data.createdOn`, renders via `<TimeAgo>`.
4. **`src/components/Table/cells/CellModified.tsx`** — Reads `row.data.savedOn`, renders via `<TimeAgo>`.

Standard cells use `TableRowContext` directly (not `createUseTableRow`) since they need to work with any table row type. Export from `@webiny/app-aco`.

**In Redirects:**

- Rewrite `Table/Table.tsx` — use `useListViewTableProps()` hook, spread result onto `<AcoTable>`. Keeps row mapping logic (domain-specific `TableRowMapper`) but eliminates the sort/selection bridge.
- Delete: `Table/Cells/CellAuthor.tsx`, `Table/Cells/CellCreated.tsx`, `Table/Cells/CellModified.tsx` — replaced by standard cells from `app-aco`.
- Update `RedirectsListConfig.tsx` to import standard cells from `@webiny/app-aco`.

### Acceptance criteria

- [ ] `useListViewTableProps()` correctly bridges sort (ListPresenter ↔ ACO Table format)
- [ ] `useListViewTableProps()` correctly bridges selection (selectedIds → selected rows, onSelectRow → actions.selection.selectRows)
- [ ] Standard cells render author name, created date, modified date correctly
- [ ] Redirects `Table.tsx` reduced from ~55 to ~20 lines
- [ ] Standard cells used in `RedirectsListConfig.tsx`

### Key files to modify

- Create: `ListViewTable.tsx` in `app-admin`, `cells/` in `app-aco`
- Modify: `Table/Table.tsx`, `RedirectsListConfig.tsx`
- Delete: `Table/Cells/CellAuthor.tsx`, `Table/Cells/CellCreated.tsx`, `Table/Cells/CellModified.tsx`

---

## Phase 4: Cleanup + Exports [x]

**Goal**: Final cleanup, proper public API exports, delete all dead code.

### What to build

- Update `packages/app-admin/src/components/index.ts` (or equivalent barrel) to export `ListView` and `useListView`.
- Update `packages/app-aco/src/index.ts` to export standard cells.
- Delete all unused files in Redirects module.
- Verify no broken imports across the monorepo.

### Acceptance criteria

- [ ] `ListView` exported from `@webiny/app-admin`
- [ ] Standard cells exported from `@webiny/app-aco`
- [ ] No dead code in Redirects module
- [ ] `yarn build` passes for `app-admin`, `app-aco`, `app-website-builder`
- [ ] `yarn lint` passes

---

## Verification

After each phase:

1. `yarn build -p @webiny/app-admin --no-cache --safe-replace` — confirm build
2. `yarn build -p @webiny/app-website-builder --no-cache --safe-replace` — confirm consumer builds
3. Start dev server, navigate to Redirects list — visual parity check
4. Test: search, filter toggle, sort columns, select rows, bulk actions, scroll loadMore, empty states, folder navigation
