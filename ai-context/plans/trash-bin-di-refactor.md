# TrashBin: Move to app-admin as Generic DI Feature

## Context

The current `@webiny/app-trash-bin` package reinvents list management (12 use cases, 11 controllers, 6 repositories) that `ListPresenter` already handles generically. The goal is to rebuild TrashBin as a lean presentation feature in `app-admin` using the existing DI/feature patterns, then wire CMS to use it. Website Builder stays on the old package for now.

The TrashBin reduces to:
- `ListPresenter<TrashBinItem>` + `IDataSource` for listing
- Restore, delete, bulk action gateways (abstractions in app-admin, CMS implementations)
- An overlay component composing `ListView` + `OverlayLayout`, with configurable columns/actions

## Phase 1: Generic TrashBin in app-admin

### 1.1 Abstractions (`packages/app-admin/src/presentation/trashBin/abstractions.ts`)

Define DI tokens and interfaces:

```typescript
// TrashBinItem — the universal row type
interface TrashBinItem {
  id: string;
  title: string;
  location: { folderId: string | undefined };
  createdBy: { id: string; displayName: string; type: string };
  deletedBy: { id: string; displayName: string; type: string };
  deletedOn: string;
}

// Gateway abstractions (each app provides implementations via DI)
// Params are kept generic; CMS implementations extend with model in their own execute() params
TrashBinListGateway    — execute(params: { where?, sort?, limit?, after?, search? }) → { data: TrashBinItem[], meta }
TrashBinDeleteGateway  — execute(id: string) → boolean
TrashBinRestoreGateway — execute(id: string) → TrashBinItem
TrashBinBulkActionGateway — execute(params: { action, where?, search? }) → { id: string }
TrashBinItemMapper     — toItem(raw: unknown) → TrashBinItem

// Presenter abstraction
TrashBinPresenter — vm: ITrashBinViewModel, actions: ITrashBinActions
  ITrashBinViewModel = { list: IListViewModel<TrashBinItem>, title: string, nameColumnId: string }
  ITrashBinActions extends IListActions + { restoreItem(id), deleteItem(id), bulkRestore(), bulkDelete() }
```

All gateways, mapper, and ListPresenter are **constructor dependencies** — injected via DI, never passed through methods.

Follow the pattern from `listPresenter/abstractions.ts`: interface + `createAbstraction` + namespace.

### 1.2 TrashBinDataSource (`presentation/trashBin/TrashBinDataSource.ts`)

Implements `IDataSource<TrashBinItem>`. Bridges the `TrashBinListGateway` + `TrashBinItemMapper` to `IDataSource`:
- `query(params)` → calls list gateway, maps results through item mapper, stores rows + meta
- `loadMore(params)` → same with cursor
- MobX observables for `rows`, `meta`, `loading`
- `removeItem(id)` for optimistic removal after delete

Follow the `ContentEntriesDataSource` pattern exactly.

### 1.3 TrashBinPresenter (`presentation/trashBin/TrashBinPresenter.ts`)

MobX presenter composing `ListPresenter<TrashBinItem>`:
- **All dependencies injected via DI constructor**: `ListPresenter`, `TrashBinListGateway`, `TrashBinDeleteGateway`, `TrashBinRestoreGateway`, `TrashBinBulkActionGateway`, `TrashBinItemMapper`
- `init(config: { title, nameColumnId, initialSort? })` — creates `TrashBinDataSource` (using the injected list gateway + item mapper), calls `listPresenter.init({ dataSource })`
- `dispose()` — cleanup
- `vm` computed getter: `{ list: listPresenter.vm, title, nameColumnId }`
- `actions`: delegates list actions to listPresenter + adds `restoreItem`, `deleteItem`, `bulkRestore`, `bulkDelete`
  - `restoreItem(id)` → calls restore gateway, refreshes list
  - `deleteItem(id)` → calls delete gateway, removes from data source, refreshes
  - `bulkRestore()` → calls bulk action gateway with `action: "restore"`, deselect all, refresh
  - `bulkDelete()` → calls bulk action gateway with `action: "delete"`, deselect all, refresh

Follow `ContentEntriesPresenter` pattern: `Abstraction.createImplementation({ implementation, dependencies: [ListPresenter, TrashBinListGateway, TrashBinDeleteGateway, TrashBinRestoreGateway, TrashBinBulkActionGateway, TrashBinItemMapper] })`.

### 1.4 Feature (`presentation/trashBin/feature.ts`)

```typescript
export const TrashBinFeature = createFeature({
  name: "TrashBin",
  register(container) {
    container.register(TrashBinPresenterImplementation).inSingletonScope();
  },
  resolve(container) {
    return { presenter: container.resolve(TrashBinPresenterAbstraction) };
  }
});
```

### 1.5 TrashBinOverlay — compose from ListView + OverlayLayout

`ListView` already provides: search input (Header), bulk actions bar, scrollable content with load-more, bottom bar (meta + loading status), empty states, and selection UI. `OverlayLayout` provides the full-screen modal shell with close button.

**TrashBinOverlay composes these — no need to port SearchInput, BulkActions shell, BottomInfoBar, Empty, or Scrollbar from app-trash-bin.**

Structure in `presentation/trashBin/`:

**`TrashBinOverlay.tsx`** — the main overlay component:
- Wraps `OverlayLayout` (for modal shell) containing a `ListView` (for list UI)
- Passes `presenter.vm.list` and `presenter.actions` to ListView
- ListView.Header: title + search
- ListView.BulkActions: restore + delete bulk action buttons
- ListView.Content: table + empty state + scroll-to-load-more
- ListView.BottomBar: meta + loading status

**`TrashBinTable.tsx`** — custom table rendering:
- Uses `DataTable` from `@webiny/admin-ui` (or ACO Table)
- Defines columns: name, author (createdBy), deleted by, deleted on, actions
- Wires sorting/selection via `useListViewTableProps()`

**Only genuinely new cell components** (port from app-trash-bin, these have trash-bin-specific rendering):
- `cells/CellDeletedBy.tsx` — renders deletedBy user info
- `cells/CellDeletedOn.tsx` — renders deletedOn date

**Only genuinely new action components**:
- `actions/RestoreItemAction.tsx` — restore button per row
- `actions/DeleteItemAction.tsx` — permanent delete button per row

**Config system** (port from app-trash-bin — this IS genuinely new, ListView doesn't have configurable columns):
- `configs/TrashBinListConfig.tsx` — `createConfigurableComponent` based config for columns/actions
- `configs/Browser/` — Column, Sorting, BulkAction, EntryAction config primitives

**`TrashBinConfigs.tsx`** — default column/action config (registered in Admin.tsx):
- Registers standard columns (name, createdBy, deletedBy, deletedOn, actions)
- Registers standard bulk actions (restore, delete)
- Registers standard entry actions (restore, delete)

**`useTrashBin.tsx`** — context hook providing presenter vm + actions to descendant components

**NOT ported** (already provided by ListView):
- SearchInput → ListView.Header has built-in search
- BulkActions shell → ListView.BulkActions
- BottomInfoBar, ListMeta, ListStatus → ListView.BottomBar
- Empty state → ListView.Content empty prop
- Scrollbar + load-more → ListView.Content with loadMoreThreshold
- Title → ListView.Header or OverlayLayout barLeft

### 1.6 Index + exports (`presentation/trashBin/index.ts`)

Export: `TrashBinFeature`, abstractions, `TrashBinOverlay`, `TrashBinConfigs`, `TrashBinItem` type, hooks.

---

## Phase 2: CMS Gateway Implementations

### 2.1 CMS Trash Bin Gateways (`packages/app-headless-cms/src/features/contentEntry/trashBin/`)

Create DI-based gateway implementations. Each uses `CmsGraphQLClient` (not Apollo directly):

**`abstractions.ts`** — CMS-specific params/result types + abstraction re-exports

**`CmsTrashBinListGateway.ts`**:
- Depends on: `CmsGraphQLClient`
- `execute(params)` → calls `client.execute()` with `createListQuery(model, fields, true)`
- Takes `model` in params (like `ListEntriesGateway` pattern)
- Filters fields to: text, number, boolean, file, long-text, ref, datetime

**`CmsTrashBinDeleteGateway.ts`**:
- Depends on: `CmsGraphQLClient`
- `execute(params: { model, id })` → `createDeleteMutation(model)` with `permanently: true`

**`CmsTrashBinRestoreGateway.ts`**:
- Depends on: `CmsGraphQLClient`
- `execute(params: { model, id })` → `createRestoreFromBinMutation(model)`

**`CmsTrashBinBulkActionGateway.ts`**:
- Depends on: `CmsGraphQLClient`
- `execute(params: { model, action, where?, search? })` → `createBulkActionMutation(model)`

**`CmsTrashBinItemMapper.ts`**:
- Maps `CmsContentEntry` → `TrashBinItem` (id=entryId, title=meta.title, etc.)

**`CmsTrashBinDataSource.ts`**:
- Extends the generic `TrashBinDataSource` concept but holds `CmsModel`
- Calls `CmsTrashBinListGateway` with model in params
- Maps results through `CmsTrashBinItemMapper`
- Implements `IDataSource<TrashBinItem>`

### 2.2 CMS Trash Bin Feature (`features/contentEntry/trashBin/feature.ts`)

```typescript
export const CmsTrashBinFeature = createFeature({
  name: "CmsContentEntry/TrashBin",
  register(container) {
    container.register(CmsTrashBinListGateway).inSingletonScope();
    container.register(CmsTrashBinDeleteGateway).inSingletonScope();
    container.register(CmsTrashBinRestoreGateway).inSingletonScope();
    container.register(CmsTrashBinBulkActionGateway).inSingletonScope();
    container.register(CmsTrashBinItemMapper).inSingletonScope();
    TrashBinFeature.register(container);
  }
});
```

### 2.3 Register in ContentEntryFeature

File: `packages/app-headless-cms/src/features/contentEntry/feature.ts`
- Add `CmsTrashBinFeature.register(container)` alongside existing sub-features

### 2.4 CMS TrashBin Presenter Wrapper

A thin CMS-specific component or hook that:
1. Resolves `TrashBinPresenter` from DI via `useFeature(TrashBinFeature)` — all gateways + mapper are already injected via constructor
2. On mount, calls `presenter.init({ title: "Trash - {model.name}", nameColumnId: model.titleFieldId })` — config only, no dependencies
3. On unmount, calls `presenter.dispose()`

This lives in a new CMS presentation file (or directly in the sidebar integration).

Note: The CMS list gateway needs the `CmsModel` to build queries. The gateway's `execute()` params include `model` (same pattern as `ListEntriesGateway`). The `CmsTrashBinDataSource` holds the model reference and passes it through.

---

## Phase 3: Wire Up in CMS UI

### 3.1 Update ContentEntriesView.tsx

File: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntriesView.tsx`

Add to scoped container setup:
```typescript
CmsTrashBinFeature.register(child);
```

(This is automatically included if we add it to `ContentEntryFeature`, which already gets registered.)

### 3.2 Update SidebarFooter

File: `packages/app-headless-cms/src/admin/components/ContentEntries/SidebarFooter/SidebarFooter.tsx`

Uncomment and update:
- Import the new `TrashBinOverlay` from `@webiny/app-admin/presentation/trashBin/`
- Import `TrashBinButton` (port from existing or inline)
- Use `useState` for open/close
- Resolve presenter from DI, init on overlay open with model context

### 3.3 Update Admin.tsx

File: `packages/app-serverless-cms/src/Admin.tsx`

Change:
```typescript
import { TrashBinConfigs } from "@webiny/app-trash-bin";
```
To:
```typescript
import { TrashBinConfigs } from "@webiny/app-admin/presentation/trashBin/index.js";
```

---

## Phase 4: Cleanup

### 4.1 Delete old CMS trash bin adapters

Delete entire directory: `packages/app-headless-cms/src/admin/components/ContentEntries/TrashBin/`

### 4.2 Update package.json

- `packages/app-headless-cms/package.json` — remove `@webiny/app-trash-bin` dependency
- `packages/app-serverless-cms/package.json` — keep `@webiny/app-trash-bin` (WB still uses it)
- `packages/app-admin/package.json` — ensure any new deps are declared

---

## Critical Existing Code to Reuse

| What | Where |
|------|-------|
| `ListPresenter` + `IDataSource` | `app-admin/src/presentation/listPresenter/` |
| `ListView` + `OverlayLayout` | `app-admin/src/components/` |
| `useListViewTableProps()` | `app-admin/src/components/ListView/` |
| `createAbstraction`, `createFeature` | `@webiny/feature/admin` |
| `CmsGraphQLClient` | `app-headless-cms/src/features/graphQLClient/` |
| `createListQuery(model, fields, deleted)` | `@webiny/app-headless-cms-common` |
| `createDeleteMutation(model)` | `@webiny/app-headless-cms-common` |
| `createRestoreFromBinMutation(model)` | `@webiny/app-headless-cms-common` |
| `createBulkActionMutation(model)` | `@webiny/app-headless-cms-common` |
| `ContentEntriesDataSource` pattern | `app-headless-cms/src/presentation/contentEntries/list/` |
| `ContentEntriesPresenter` pattern | `app-headless-cms/src/presentation/contentEntries/list/` |
| Existing trash bin cell/action components | `app-trash-bin/src/Presentation/` (port only unique ones) |
| Existing CMS gateway adapters | `app-headless-cms/src/admin/components/ContentEntries/TrashBin/adapters/` (reference for logic) |

## Verification

1. `yarn check -p @webiny/app-admin` passes
2. `yarn check -p @webiny/app-headless-cms` passes
3. `yarn check -p @webiny/app-serverless-cms` passes
4. Open a content model → sidebar shows Trash button
5. Click Trash → overlay opens with deleted entries listed
6. Search and sort work in the trash bin
7. Restore an entry → it disappears from trash, reappears in main list
8. Permanently delete → entry removed from trash
9. Bulk select + restore/delete → works
10. Website Builder trash bin still works (unchanged, uses old package)
