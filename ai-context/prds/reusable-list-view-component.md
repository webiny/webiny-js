# Reusable ListView Compound Component

## Context

Every admin list view (FileManager, Redirects, Pages, future modules) repeats the same layout: sidebar with folders, header with search/filters/actions, bulk action bar, scrollable content area with table/grid, bottom info bar. The only differences are domain-specific: what the sidebar contains, what actions are available, how create/edit works (dialog vs drawer vs route), and whether the list supports grid view.

This component goes in `@webiny/app-admin` and eliminates ~200 lines of boilerplate per module.

## API Design

`ListView` is a **compound component** that receives `IListViewModel<T>` + `IListActions` as props. Sub-components read from an internal React context. Domain-specific content goes in slots.

```tsx
<ListView list={vm.list} actions={actions} showingFilters={...} onToggleFilters={...}>
    <ListView.Sidebar namespace="..." title="...">
        {/* FolderTree, tags, or any sidebar content */}
    </ListView.Sidebar>

    <ListView.Header>
        <ListView.Header.Title icon={...} text={...} />
        <ListView.Header.Search placeholder="..." />
        <ListView.Header.FiltersToggle />
        <ListView.Header.Actions>
            {/* Custom buttons: New Folder, New Item, Upload, etc. */}
        </ListView.Header.Actions>
    </ListView.Header>

    <ListView.BulkActions itemLabel="redirect" actions={browser.bulkActions} />
    <ListView.Filters filters={browser.filters} filtersToWhere={browser.filtersToWhere} />

    <ListView.Content>
        <ListView.Empty searchEmpty={<NoResults />}>
            {/* Default empty state */}
        </ListView.Empty>
        {/* Table, Grid, or any content */}
    </ListView.Content>

    <ListView.BottomBar>
        <ListView.BottomBar.Meta itemLabel="redirect" />
        <ListView.BottomBar.Status />
    </ListView.BottomBar>
</ListView>
```

## Props

### `ListView` (root)

| Prop              | Type                | Required | Description                                      |
| ----------------- | ------------------- | -------- | ------------------------------------------------ |
| `list`            | `IListViewModel<T>` | yes      | View model from ListPresenter                    |
| `actions`         | `IListActions`      | yes      | Actions from ListPresenter                       |
| `showingFilters`  | `boolean`           | no       | Whether filter panel is visible (default: false) |
| `onToggleFilters` | `() => void`        | no       | Toggle filter visibility                         |
| `children`        | `ReactNode`         | yes      | Compound sub-components                          |

### `ListView.Sidebar`

| Prop        | Type        | Required | Description                                                            |
| ----------- | ----------- | -------- | ---------------------------------------------------------------------- |
| `namespace` | `string`    | yes      | SplitView persistence key (e.g., "wb/redirect/list")                   |
| `title`     | `string`    | no       | Sidebar heading (renders `<Heading>` + `<Separator>`)                  |
| `span`      | `number`    | no       | LeftPanel span (default: 2)                                            |
| `children`  | `ReactNode` | yes      | Sidebar content — use `<ListView.Sidebar.Section>` for vertical splits |

When `<ListView.Sidebar>` is present, the layout uses `SplitView` + `LeftPanel` + `RightPanel`. When absent, it renders a single-column layout. Detection is automatic.

The sidebar container is `flex flex-col h-main-content`. Children control their own sizing. Use `<ListView.Sidebar.Section>` for independently scrollable vertical regions.

### `ListView.Sidebar.Section`

A vertical section within the sidebar. Controls whether it shrinks to fit content or expands to fill remaining space.

| Prop         | Type        | Required | Description                                                                                                                       |
| ------------ | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `grow`       | `boolean`   | no       | If true, section fills remaining space (`flex-1 min-h-0`). If false, section shrinks to fit content (`shrink-0`). Default: false. |
| `maxHeight`  | `string`    | no       | CSS max-height (e.g., `"66vh"`). Only applies when `grow` is false.                                                               |
| `scrollable` | `boolean`   | no       | Wraps content in overflow-y-auto. Default: true.                                                                                  |
| `children`   | `ReactNode` | yes      | Section content                                                                                                                   |

**Redirects sidebar** (single section, fills all space):

```tsx
<ListView.Sidebar namespace="wb/redirect/list" title="Redirects">
    <ListView.Sidebar.Section grow>
        <FolderTree vm={vm.folders} actions={actions.folders} ... />
    </ListView.Sidebar.Section>
</ListView.Sidebar>
```

**FileManager sidebar** (two sections, folders capped, tags fill remainder):

```tsx
<ListView.Sidebar namespace="fm/file/list" title="File Manager">
    <ListView.Sidebar.Section maxHeight="66vh">
        <FolderTree vm={vm.folders} actions={actions.folders} ... />
    </ListView.Sidebar.Section>
    <Separator />
    <ListView.Sidebar.Section grow>
        <TagsList tags={vm.tags} ... />
    </ListView.Sidebar.Section>
</ListView.Sidebar>
```

**Rendered HTML structure:**

```html
<div class="flex flex-col h-main-content">
  <!-- title + separator (from sidebar title prop) -->
  <div class="py-sm px-md"><h5>File Manager</h5></div>
  <hr />

  <!-- Section 1: folders (shrink-0, capped height) -->
  <div class="shrink-0 overflow-y-auto" style="max-height: 66vh">
    <!-- FolderTree -->
  </div>

  <hr />

  <!-- Section 2: tags (flex-1, fills remaining) -->
  <div class="flex-1 overflow-y-auto min-h-0">
    <!-- TagsList -->
  </div>
</div>
```

### `ListView.Header.Title`

| Prop    | Type           | Required | Description                                           |
| ------- | -------------- | -------- | ----------------------------------------------------- |
| `icon`  | `ReactElement` | yes      | Icon (HomeIcon, FolderIcon, etc.)                     |
| `text`  | `string`       | no       | Title text. Shows `<Skeleton>` when undefined.        |
| `after` | `ReactNode`    | no       | Extra content after title (e.g., folder context menu) |

### `ListView.Header.Search`

Observer component. Reads `list.search` from context, calls `actions.search.set()` / `actions.search.clear()`. Uses `DelayedOnChange` + `Input` with search icon.

| Prop          | Type     | Required | Description          |
| ------------- | -------- | -------- | -------------------- |
| `placeholder` | `string` | no       | Default: "Search..." |

### `ListView.Header.FiltersToggle`

Observer component. Reads `showingFilters` from context, calls `onToggleFilters`. Delegates to existing `FiltersToggle` from `@webiny/app-admin`.

### `ListView.Header.Actions`

Pass-through container. Renders children in `flex gap-sm`.

### `ListView.BulkActions`

Observer component. Reads `list.selection.selectedCount` from context. Shows grey bar with count label + action buttons + close (deselectAll) when `selectedCount > 0`. Hidden otherwise.

| Prop              | Type                 | Required | Description                                 |
| ----------------- | -------------------- | -------- | ------------------------------------------- |
| `itemLabel`       | `string`             | yes      | Singular label ("redirect", "file", "page") |
| `itemLabelPlural` | `string`             | no       | Plural form. Default: `itemLabel + "s"`     |
| `actions`         | `BulkActionConfig[]` | yes      | From browser config                         |

### `ListView.Filters`

Observer component. Reads `showingFilters` from context. Delegates to existing `<Filters>` component. Applies `filtersToWhere` converters on change, then calls `actions.filter.set()` for each key.

| Prop             | Type             | Required | Description         |
| ---------------- | ---------------- | -------- | ------------------- |
| `filters`        | `FilterConfig[]` | yes      | From browser config |
| `filtersToWhere` | `Converter[]`    | no       | Transform functions |

### `ListView.Content`

Wraps children in `ScrollArea` with debounced scroll-to-loadMore. Calls `actions.loadMore()` when scroll position exceeds threshold.

| Prop                 | Type     | Required | Description       |
| -------------------- | -------- | -------- | ----------------- |
| `loadMoreThreshold`  | `number` | no       | 0-1, default: 0.8 |
| `loadMoreDebounceMs` | `number` | no       | Default: 200      |

### `ListView.Empty`

Conditional wrapper. Reads `list.empty` and `list.emptyWithFilters` from context.

- When empty with active search/filters: renders `searchEmpty`
- When empty without filters: renders `children`
- When not empty: renders nothing

| Prop          | Type        | Required | Description                      |
| ------------- | ----------- | -------- | -------------------------------- |
| `searchEmpty` | `ReactNode` | no       | Empty state during search/filter |
| `children`    | `ReactNode` | yes      | Default empty state              |

### `ListView.BottomBar`

Sticky bar at bottom with `<Separator>` on top. Contains two sub-components:

**`ListView.BottomBar.Meta`** — "Showing X out of Y items". Observer, reads from context.

| Prop        | Type     | Required | Description                |
| ----------- | -------- | -------- | -------------------------- |
| `itemLabel` | `string` | yes      | "redirect", "file", "page" |

**`ListView.BottomBar.Status`** — Loading spinner when `loadingMore` is true.

| Prop          | Type     | Required | Description                             |
| ------------- | -------- | -------- | --------------------------------------- |
| `loadingText` | `string` | no       | Custom text. Default: "Loading more..." |

## Usage Examples

### Redirects (dialog create/edit, folders, table only)

```tsx
const DocumentList = observer(() => {
    const { vm, actions } = useRedirectListPresenter();
    const { browser } = useRedirectListConfig();
    const { showDialog: showCreateFolderDialog } = useCreateDialog();
    const folderId = vm.folders.currentFolderId ?? "root";

    return (
        <>
            <ListView
                list={vm.list}
                actions={actions}
                showingFilters={vm.showingFilters}
                onToggleFilters={() => vm.showingFilters ? actions.hideFilters() : actions.showFilters()}
            >
                <ListView.Sidebar namespace="wb/redirect/list" title="Redirects">
                    <ListView.Sidebar.Section grow>
                        <FolderTree vm={vm.folders} actions={actions.folders}
                                    folderActions={browser.folder.actions}
                                    enableActions enableCreate />
                    </ListView.Sidebar.Section>
                </ListView.Sidebar>

                <ListView.Header>
                    <ListView.Header.Title
                        icon={folderId === "root" ? <HomeIcon /> : <FolderIcon />}
                        text={folderId === "root" ? "Home" : vm.folders.currentFolderTitle}
                    />
                    <ListView.Header.Search />
                    <ListView.Header.FiltersToggle />
                    <ListView.Header.Actions>
                        <Button onClick={() => showCreateFolderDialog({ currentParentId: folderId })}>
                            New Folder
                        </Button>
                        <Button onClick={() => actions.showCreateDialog(folderId)}>
                            New Redirect
                        </Button>
                    </ListView.Header.Actions>
                </ListView.Header>

                <ListView.BulkActions itemLabel="redirect" actions={browser.bulkActions} />
                <ListView.Filters filters={browser.filters} filtersToWhere={browser.filtersToWhere} />

                <ListView.Content>
                    <ListView.Empty searchEmpty={<NoResults />}>
                        <EmptyFolder onCreateRedirect={...} onCreateFolder={...} />
                    </ListView.Empty>
                    <RedirectTable />
                </ListView.Content>

                <ListView.BottomBar>
                    <ListView.BottomBar.Meta itemLabel="redirect" />
                    <ListView.BottomBar.Status />
                </ListView.BottomBar>
            </ListView>

            <CreateRedirectDialog />
            <EditRedirectDialog />
        </>
    );
});
```

### FileManager (drawer edit, grid+table toggle, upload, tags sidebar)

```tsx
const FileManagerLayout = observer(() => {
    const { vm, actions } = useFileManagerPresenter();
    const { browser } = useFileManagerConfig();

    return (
        <>
            <FileDetailsDrawer />

            <ListView
                list={vm.list}
                actions={actions}
                showingFilters={vm.showingFilters}
                onToggleFilters={() => vm.showingFilters ? actions.hideFilters() : actions.showFilters()}
            >
                <ListView.Sidebar namespace="fm/file/list" title="File Manager">
                    <ListView.Sidebar.Section maxHeight="66vh">
                        <FolderTree vm={vm.folders} actions={actions.folders} ... />
                    </ListView.Sidebar.Section>
                    {browser.filterByTags && (
                        <>
                            <Separator />
                            <ListView.Sidebar.Section grow>
                                <TagsList tags={vm.tags} ... />
                            </ListView.Sidebar.Section>
                        </>
                    )}
                </ListView.Sidebar>

                <ListView.Header>
                    <ListView.Header.Title icon={<FolderIcon />} text={vm.folders.currentFolderTitle} />
                    <ListView.Header.Search />
                    <ListView.Header.FiltersToggle />
                    <ViewModeSwitch viewMode={vm.viewMode} onChange={actions.setViewMode} />
                    <ListView.Header.Actions>
                        <Button onClick={browseFiles}>Upload</Button>
                    </ListView.Header.Actions>
                </ListView.Header>

                <ListView.BulkActions itemLabel="file" actions={browser.bulkActions} />
                <ListView.Filters filters={browser.filters} filtersToWhere={browser.filtersToWhere} />

                <ListView.Content>
                    <ListView.Empty searchEmpty={<NoResults />}>
                        <FileDropArea />
                    </ListView.Empty>
                    {vm.viewMode === "table" ? <FileTable /> : <FileGrid />}
                    <UploadProgress />
                </ListView.Content>

                <ListView.BottomBar>
                    <SupportedFileTypes accept={overlay?.accept ?? []} />
                    <ListView.BottomBar.Status />
                </ListView.BottomBar>
            </ListView>
        </>
    );
});
```

### Simple list without folders (e.g., API Keys)

```tsx
const ApiKeyList = observer(() => {
  const { presenter } = useFeature(ApiKeyListFeature);

  return (
    <ListView list={presenter.vm} actions={presenter.actions}>
      <ListView.Header>
        <ListView.Header.Title icon={<KeyIcon />} text="API Keys" />
        <ListView.Header.Search />
        <ListView.Header.Actions>
          <Button onClick={() => router.goToRoute(Routes.ApiKeys.Create)}>New API Key</Button>
        </ListView.Header.Actions>
      </ListView.Header>

      <ListView.Content>
        <ListView.Empty>
          <EmptyView title="No API keys." action={<CreateButton />} />
        </ListView.Empty>
        <ApiKeyTable />
      </ListView.Content>

      <ListView.BottomBar>
        <ListView.BottomBar.Meta itemLabel="API key" />
        <ListView.BottomBar.Status />
      </ListView.BottomBar>
    </ListView>
  );
});
```

## ListView.Table — Table Bridge Component

`ListView.Table` eliminates the per-module table bridge boilerplate (sorting conversion, selection sync, row mapping, folder+record merging). It reads `list` and `actions` from the ListView context and wires them to the ACO `Table` internally.

### Props

| Prop           | Type                            | Required | Description                                                            |
| -------------- | ------------------------------- | -------- | ---------------------------------------------------------------------- |
| `columns`      | `ColumnConfig[]`                | yes      | From module's browser config                                           |
| `namespace`    | `string`                        | yes      | LocalStorage key for column visibility                                 |
| `nameColumnId` | `string`                        | no       | Which column is the "name" column (default: "name")                    |
| `folders`      | `FolderDto[]`                   | no       | Folder rows to prepend. Omit for no-folder views.                      |
| `showFolders`  | `boolean`                       | no       | Whether to show folder rows. Default: true when `folders` is provided. |
| `rowMapper`    | `(entity: T) => RecordTableRow` | yes      | Maps domain entity → ACO table row                                     |
| `onRowClick`   | `(row: TableRow) => void`       | no       | Click handler for row (e.g., open editor)                              |

### What it handles internally

1. **Row composition**: merges `folders.map(FolderDtoMapper.toTableRow)` + `list.rows.map(rowMapper)`, folders first
2. **Sort bridging**: converts `list.sort` → `[{ id, desc }]` for ACO Table, and `onSortingChange` → `actions.sort.set(field, direction)`
3. **Selection bridging**: converts `list.selection.selectedIds` → `selected` rows, and `onSelectRow` → `actions.selection.selectRows(ids)`
4. **Loading**: passes `list.pagination.loading` to table

### Usage

```tsx
// Redirects — just this, no more 55-line Table.tsx
<ListView.Table
    columns={browser.table.columns}
    namespace="wb/redirect/list"
    nameColumnId="redirectFrom"
    folders={vm.folders.childFolders}
    showFolders={vm.showFolders}
    rowMapper={redirect => ({
        id: redirect.id,
        $type: "RECORD",
        $selectable: true,
        data: RedirectDtoMapper.toDTO(redirect)
    })}
/>

// Simple list without folders
<ListView.Table
    columns={browser.table.columns}
    namespace="webhooks/list"
    rowMapper={webhook => ({
        id: webhook.id,
        $type: "RECORD",
        $selectable: true,
        data: webhook
    })}
/>
```

### FolderDtoMapper.toTableRow

The folder → table row mapping is always the same:

```typescript
{ id: folder.id, $type: "FOLDER", $selectable: false, data: FolderDtoMapper.toDTO(folder) }
```

This is built into `ListView.Table` — consumers don't need a `TableRowMapper` at all for folders.

---

## Standard Cell Renderers

ListView exports reusable cell renderers for common metadata fields. These eliminate the 5-6 identical cell files that every module currently duplicates.

Each cell reads from the ACO table's `useTableRow()` hook. They work with any row whose `data` has the standard fields (`createdBy`, `createdOn`, `savedOn`, etc.).

### Exported cells

```typescript
// @webiny/app-admin/components/ListView

// "Created by" — renders createdBy.displayName
export const CellAuthor: React.FC;

// "Created on" — renders createdOn via <TimeAgo>
export const CellCreated: React.FC;

// "Modified on" — renders savedOn via <TimeAgo>
export const CellModified: React.FC;
```

### How modules use them

Modules import standard cells from `@webiny/app-admin` and only write cells for domain-specific fields:

```tsx
// RedirectsListConfig.tsx
import { CellAuthor, CellCreated, CellModified } from "@webiny/app-admin";

<Browser.Table.Column name="title" header="From / To" cell={<CellName />} />
<Browser.Table.Column name="redirectType" header="Type" cell={<CellRedirectType />} />
<Browser.Table.Column name="isEnabled" header="Enabled" cell={<CellEnabled />} />
<Browser.Table.Column name="createdBy" header="Author" cell={<CellAuthor />} />
<Browser.Table.Column name="createdOn" header="Created" cell={<CellCreated />} />
<Browser.Table.Column name="savedOn" header="Modified" cell={<CellModified />} />
```

Domain-specific cells (`CellName`, `CellRedirectType`, `CellEnabled`) stay in the module. Standard cells (`CellAuthor`, `CellCreated`, `CellModified`) come from `app-admin`.

### How standard cells work

They use the ACO table's `useTableRow()` hook, which provides `{ row }` where `row.data` is the entity DTO. The standard fields (`createdBy`, `createdOn`, `savedOn`) exist on every Webiny entity, so these cells are universally applicable.

```tsx
// In @webiny/app-admin/components/ListView/cells/CellAuthor.tsx
import React from "react";

export const CellAuthor = () => {
  // useTableRow from the closest Table's context — works with any ACO Table
  const { row } = useTableRow();
  return <>{row.data.createdBy?.displayName ?? ""}</>;
};
```

The `useTableRow` is created per-table via `createUseTableRow()` in the ACO config. The standard cells need to receive the correct `useTableRow` — this is handled by the module's config system (e.g., `RedirectListConfig.Browser.Table.Column.useTableRow`). The standard cells are **components**, not hooks — the ACO Table wraps each cell in a `TableRowProvider` that supplies the row context.

### CellActions — stays module-specific

The actions cell (Edit, Delete, Move dropdown) is always module-specific because:

- It wraps the row data in a module-specific provider (`RedirectProvider`, `FileProvider`)
- It renders module-specific action configs (`browser.redirect.actions`, `browser.file.actions`)
- Folder rows use `FolderProvider` + folder-specific actions

This cell is NOT extracted as a standard cell.

---

## What ListView Does NOT Own

- **Create/Edit UI** — dialogs, drawers, route navigation are rendered alongside `<ListView>`, not inside it
- **Folder tree** — consumer provides `<FolderTree>` inside `<ListView.Sidebar>`
- **Domain-specific empty states** — consumer provides custom empty UI via `<ListView.Empty>`
- **Domain-specific cell renderers** — CellName, CellActions, custom fields stay in the module
- **Module config system** — each module keeps its own config (RedirectListConfig, FileManagerViewConfig)
- **Presenter wiring** — consumer resolves presenter from DI, calls init/dispose

## What ListView DOES Own

- **Layout structure** — SplitView detection, left/right panels, sticky bottom bar
- **Scroll-to-loadMore** — debounced scroll handler calling `actions.loadMore()`
- **Search** — debounced input wired to `actions.search.set/clear`
- **Filters toggle** — reads `showingFilters`, delegates to `FiltersToggle`
- **Filters apply** — `filtersToWhere` conversion + `actions.filter.set`
- **Bulk action bar** — selection count, label formatting, deselect button
- **Table bridge** — sort/selection/row-mapping wiring between ListPresenter and ACO Table
- **Standard cell renderers** — CellAuthor, CellCreated, CellModified
- **Bottom bar** — meta counts ("Showing X of Y"), loading spinner
- **Empty state logic** — conditional rendering based on `list.empty` / `list.emptyWithFilters`
- **React context** — `useListView()` hook for sub-components that need direct access

## File Structure

```
packages/app-admin/src/components/ListView/
├── ListView.tsx              # Root component + context provider + sidebar detection
├── ListViewHeader.tsx        # Header container + Title + Search + FiltersToggle + Actions
├── ListViewSidebar.tsx       # Sidebar with optional title + Section
├── ListViewContent.tsx       # Scrollable content with loadMore
├── ListViewTable.tsx         # Table bridge (sort/selection/row-mapping to ACO Table)
├── ListViewBulkActions.tsx   # Bulk action bar
├── ListViewFilters.tsx       # Filters integration
├── ListViewBottomBar.tsx     # Bottom bar + Meta + Status
├── ListViewEmpty.tsx         # Conditional empty state
├── cells/
│   ├── CellAuthor.tsx        # Standard: createdBy.displayName
│   ├── CellCreated.tsx       # Standard: createdOn via TimeAgo
│   └── CellModified.tsx      # Standard: savedOn via TimeAgo
├── context.ts                # ListViewContext + useListView
├── types.ts                  # TypeScript interfaces
└── index.ts                  # Compound component assembly + exports
```

## Implementation Order

1. `types.ts` + `context.ts`
2. `ListView.tsx` (root with context + sidebar detection)
3. `ListViewSidebar.tsx` (with Section sub-component)
4. `ListViewHeader.tsx` (Title, Search, FiltersToggle, Actions)
5. `ListViewContent.tsx` (scroll + loadMore)
6. `ListViewEmpty.tsx`
7. `ListViewTable.tsx` (sort/selection/row bridging to ACO Table)
8. `cells/CellAuthor.tsx`, `CellCreated.tsx`, `CellModified.tsx`
9. `ListViewBulkActions.tsx`
10. `ListViewFilters.tsx`
11. `ListViewBottomBar.tsx` (Meta, Status)
12. `index.ts` (compound assembly)
13. Migrate Redirects to use ListView
14. Migrate FileManager to use ListView
