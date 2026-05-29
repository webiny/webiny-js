# Migrate Redirects to ListPresenter + RedirectDetails Presenter Pattern

## Context

The Redirects feature has ~75 files with massive boilerplate. This migration adopts the File Manager architecture:

1. **RedirectListPresenter** (like `FileManagerPresenter`) — composes `ListPresenter` + `FolderTreePresenter`, manages list state and embeds create/edit presenters
2. **CreateRedirectPresenter** + **EditRedirectPresenter** (like `FileDetailsPresenter`) — each owns form state via `FormModelFactory`, handles its mutation, exposes `vm.form` for `FormView` rendering
3. **Delete/Move** — simple hooks that resolve use cases from the container (like `useDeleteFile` / `useMoveFileToFolder`), not part of any presenter

## Key Reference Files

| Pattern | Reference |
|---|---|
| List Presenter + embedded details | `app-file-manager/src/presentation/FileList/FileManagerPresenter.ts` |
| Details Presenter (form, load, save) | `app-file-manager/src/presentation/FileDetails/FileDetailsPresenter.ts` |
| Details UI (FormView + Drawer) | `app-file-manager/src/presentation/FileDetails/components/FileDetailsDrawer.tsx` |
| DataSource | `app-file-manager/src/presentation/FileList/FileListDataSource.ts` |
| Delete hook (useContainer + confirmation) | `app-file-manager/src/presentation/hooks/useDeleteFile.tsx` |
| Move hook (useContainer + ACO dialog) | `app-file-manager/src/presentation/hooks/useMoveFileToFolder.ts` |
| MainGraphQLClient gateway | `app-website-builder/src/features/pages/createPage/CreatePageGateway.ts` |

---

## Phase 1: Shared Cache Infrastructure

Create `features/redirects/shared/`

**`abstractions.ts`** — `RedirectsListCache = createAbstraction<IListCache<Redirect>>(...)`  
**`feature.ts`** — `SharedRedirectCacheFeature` registers a `ListCache<Redirect>` instance  
**`index.ts`** — re-exports

Replaces the global `redirectListCache` singleton from `domain/Redirect/`.

---

## Phase 2: List Redirects Feature

Create `features/redirects/listRedirects/`

**`abstractions.ts`** — `ListRedirectsGateway`, `ListRedirectsUseCase` abstractions  
**`ListRedirectsGateway.ts`** — `MainGraphQLClient`, hardcoded `/* GraphQL */` query, `createImplementation({ dependencies: [MainGraphQLClient] })`  
**`ListRedirectsUseCase.ts`** — Delegates to gateway, `createImplementation({ dependencies: [ListRedirectsGateway] })`  
**`feature.ts`** — `ListRedirectsFeature`

Replaces `features/redirects/loadRedirects/` (24 files).

---

## Phase 3: Get Redirect Feature

Create `features/redirects/getRedirect/`

**`abstractions.ts`** — `GetRedirectUseCase`, `GetRedirectRepository` abstractions  
Interface: `execute(params: { id: string }): Promise<RedirectDto | undefined>`

**`GetRedirectRepository.ts`** — Resolves from `RedirectsListCache` via DI. Calls `cache.getItem(r => r.id === id)`, maps via `RedirectDtoMapper.toDTO()`.  
`createImplementation({ dependencies: [RedirectsListCache] })`

**`GetRedirectUseCase.ts`** — Delegates to repository.  
`createImplementation({ dependencies: [GetRedirectRepository] })`

**`feature.ts`** — `GetRedirectFeature`

---

## Phase 4: Mutation Features (Create, Delete, Update, Move)

Each mutation: `abstractions.ts` + `XxxGateway.ts` + `XxxUseCase.ts` + `feature.ts`

### Create: `features/redirects/createRedirect/`
- Gateway: `mutation CreateRedirect($data: WbRedirectCreateInput!) { ... }`, deps: `[MainGraphQLClient]`
- UseCase: calls gateway, `cache.addItems([Redirect.create(result)])`, deps: `[CreateRedirectGateway, RedirectsListCache]`

### Delete: `features/redirects/deleteRedirect/`
- Gateway: `mutation DeleteRedirect($id: ID!) { ... }`, deps: `[MainGraphQLClient]`
- UseCase: calls gateway, `cache.removeItems(r => r.id === id)`, deps: `[DeleteRedirectGateway, RedirectsListCache]`

### Update: `features/redirects/updateRedirect/`
- Gateway: `mutation UpdateRedirect($id: ID!, $data: WbRedirectUpdateInput!) { ... }`, deps: `[MainGraphQLClient]`
- UseCase: calls gateway, `cache.updateItems(...)`, deps: `[UpdateRedirectGateway, RedirectsListCache]`

### Move: `features/redirects/moveRedirect/`
- Gateway: `mutation MoveRedirect($id: ID!, $folderId: ID!) { ... }`, deps: `[MainGraphQLClient]`
- UseCase: calls gateway, `cache.removeItems(r => r.id === id)`, deps: `[MoveRedirectGateway, RedirectsListCache]`

---

## Phase 5: Create Redirect Presenter + Edit Redirect Presenter

Two separate presenters — no mode branching. Each owns its form state and mutation.

### Create: `presentation/redirects/CreateRedirect/`

**`abstractions.ts`**
```typescript
interface ICreateRedirectViewModel {
    loading: string | null;   // "Creating...", null
    form: IFormVM;
}

interface ICreateRedirectPresenter {
    vm: ICreateRedirectViewModel;
    init(folderId: string): void;
    save(): Promise<boolean>;
}

CreateRedirectPresenter = createAbstraction<ICreateRedirectPresenter>(...)
```

**`CreateRedirectPresenter.ts`**

Constructor dependencies:
- `CreateRedirectUseCase.Interface`
- `FormModelFactory.Interface`

**`init(folderId)`:** Stores `folderId`, builds form via `FormModelFactory.create()` with fields:
- `redirectFrom` (text, required)
- `redirectTo` (text, required)
- `redirectType` (select, required, options: permanent/temporary, default "permanent")
- `isEnabled` (switch)

**`save()`:** Validates via `form.submit()`, sets `loading: "Creating..."`, calls `createRedirectUseCase.execute({ location: { folderId }, ...formData })`, returns `true` on success.

**`feature.ts`** — `CreateRedirectPresenterFeature`

### Edit: `presentation/redirects/EditRedirect/`

**`abstractions.ts`**
```typescript
interface IEditRedirectViewModel {
    redirect: RedirectDto | null;
    loading: string | null;   // "Loading...", "Saving...", null
    form: IFormVM;
}

interface IEditRedirectPresenter {
    vm: IEditRedirectViewModel;
    loadRedirect(redirectId: string): Promise<void>;
    save(): Promise<boolean>;
}

EditRedirectPresenter = createAbstraction<IEditRedirectPresenter>(...)
```

**`EditRedirectPresenter.ts`**

Constructor dependencies:
- `UpdateRedirectUseCase.Interface`
- `GetRedirectUseCase.Interface`
- `FormModelFactory.Interface`

**`loadRedirect(redirectId)`:** Sets `loading: "Loading..."`, calls `getRedirectUseCase.execute({ id })`, builds form, calls `form.setData({ redirectFrom, redirectTo, redirectType, isEnabled })`, clears loading.

**`save()`:** Validates via `form.submit()`, sets `loading: "Saving..."`, calls `updateRedirectUseCase.execute({ id: redirect.id, ...formData })`, returns `true` on success.

**`feature.ts`** — `EditRedirectPresenterFeature`

---

## Phase 6: DataSource + RedirectList Presenter

Create `presentation/redirects/RedirectList/`

### `RedirectListDataSource.ts`
Implements `IDataSource<Redirect>`:
- Constructor: `ListRedirectsUseCase.Interface`, `IListCache<Redirect>`, `GetDescendantFoldersUseCase.Interface?`
- `rows` — computed from `cache.getItems()`
- `query(params)` / `loadMore(params)` — calls use case, manages cache + meta
- `buildWhere(params)` — converts `folderId` filter to `location` where clause

Reference: `FileListDataSource.ts`

### `abstractions.ts`

```typescript
interface IRedirectListViewModel {
    list: IListViewModel<Redirect>;
    folders: IFolderTreeViewModel;
    createRedirect: ICreateRedirectPresenter | null;   // Non-null when create dialog is open
    editRedirect: IEditRedirectPresenter | null;        // Non-null when edit dialog is open
    showFolders: boolean;
    showingFilters: boolean;
}

interface IRedirectListActions extends IListActions {
    showFilters(): void;
    hideFilters(): void;
    showCreateDialog(folderId: string): void;
    showEditDialog(redirectId: string): void;
    hideCreateDialog(): void;
    hideEditDialog(): void;
    folders: IFolderActions;
}

RedirectListPresenter = createAbstraction<IRedirectListPresenter>(...)
```

### `RedirectListPresenter.ts`

Composes:
- `ListPresenter.Interface<Redirect>`
- `FolderTreePresenter.Interface`
- `CreateRedirectPresenter.Interface` — embedded, like `fileDetailsPresenter` in `FileManagerPresenter`
- `EditRedirectPresenter.Interface` — embedded, same pattern
- `ListRedirectsUseCase.Interface`
- `RedirectsListCache.Interface`
- `GetDescendantFoldersUseCase.Interface`

**Key pattern** (mirrors `FileManagerPresenter` showFileDetails/hideFileDetails):
```typescript
private _createRedirect: ICreateRedirectPresenter | null = null;
private _editRedirect: IEditRedirectPresenter | null = null;

// In actions:
showCreateDialog: (folderId: string) => {
    this._createRedirect = this.createRedirectPresenter;
    this.createRedirectPresenter.init(folderId);
},
showEditDialog: (redirectId: string) => {
    this._editRedirect = this.editRedirectPresenter;
    void this.editRedirectPresenter.loadRedirect(redirectId);
},
hideCreateDialog: () => {
    this._createRedirect = null;
},
hideEditDialog: () => {
    this._editRedirect = null;
},

// In vm:
createRedirect: this._createRedirect,
editRedirect: this._editRedirect,
```

`init()`, `dispose()`, `shouldShowFolders()` — same as previous plan.

### `RedirectListPresenterProvider.tsx`
Context + `useRedirectListPresenter()` hook

### `feature.ts`
`RedirectListPresenterFeature`

---

## Phase 7: Delete + Move Hooks

These are **simple hooks** — not part of any presenter. They resolve use cases from the container and use standard dialog primitives.

### `presentation/redirects/hooks/useDeleteRedirect.tsx`

Following `useDeleteFile.tsx`:
```typescript
const container = useContainer();
const deleteRedirectUseCase = container.resolve(DeleteRedirectUseCase);
const { showConfirmation } = useConfirmationDialog({ title, message });

const openDeleteDialog = useCallback(() =>
    showConfirmation(async () => {
        await deleteRedirectUseCase.execute({ id: redirect.id });
        showSnackbar("Redirect deleted successfully.");
    }),
    [redirect]
);
return { openDeleteDialog };
```

### `presentation/redirects/hooks/useMoveRedirectToFolder.ts`

Following `useMoveFileToFolder.ts`:
```typescript
const container = useContainer();
const moveRedirectUseCase = container.resolve(MoveRedirectUseCase);
const { showDialog } = useMoveToFolderDialog();

return useCallback(() => {
    showDialog({
        title: "Move redirect to a new location",
        focusedFolderId: redirect.location.folderId,
        async onAccept({ folder }) {
            await moveRedirectUseCase.execute({ id: redirect.id, folderId: folder.id });
            showSnackbar(`Redirect moved to "${folder.label}"!`);
        }
    });
}, [redirect.id]);
```

---

## Phase 8: Wire DI Container

Modify `modules/redirects/RedirectsList.tsx` — create scoped child container:

```
SharedRedirectCacheFeature
ListRedirectsFeature
GetRedirectFeature
CreateRedirectFeature
DeleteRedirectFeature
UpdateRedirectFeature
MoveRedirectFeature
FoldersFeature (from @webiny/app-aco)
FolderTreePresenterFeature (from @webiny/app-aco)
ListPresenterFeature (from @webiny/app-admin)
CreateRedirectPresenterFeature
EditRedirectPresenterFeature
RedirectListPresenterFeature
```

Resolve list presenter via `useFeature(RedirectListPresenterFeature)`, init/dispose in `useEffect`, provide via `RedirectListPresenterProvider`.

Reference: `app-file-manager/src/presentation/FileManager/FileManagerView.tsx`

---

## Phase 9: Migrate UI Components

### List components: `useDocumentList()` → `useRedirectListPresenter()`

| Old | New |
|---|---|
| `vm.folderId` | `vm.folders.currentFolderId` |
| `vm.data` (mixed) | `vm.list.rows` + `vm.folders.childFolders` |
| `vm.selected` | `vm.list.selection.selectedIds` |
| `vm.meta.totalCount` | `vm.list.pagination.totalCount` |
| `vm.sorting` | `vm.list.sort` |
| `vm.searchQuery` | `vm.list.search` |
| `vm.isSearch` | `!vm.showFolders` |
| `vm.isEmpty` | `vm.list.empty` |
| `vm.isLoading` | `vm.list.pagination.loading` |
| `vm.isLoadingMore` | `vm.list.pagination.loadingMore` |
| `vm.isFilterVisible` | `vm.showingFilters` |

### Create dialog: presenter-driven

A `CreateRedirectDialog` component (observer) reads from `vm.createRedirect`:
```tsx
const { vm, actions } = useRedirectListPresenter();
if (!vm.createRedirect) return null;

<Dialog title="Create a Redirect" onClose={actions.hideCreateDialog}>
    {vm.createRedirect.vm.loading && <OverlayLoader text={vm.createRedirect.vm.loading} />}
    <FormView name="CreateRedirect" form={vm.createRedirect.vm.form} />
    <Dialog.ConfirmAction text="Create" onClick={async () => {
        const saved = await vm.createRedirect.save();
        if (saved) { actions.hideCreateDialog(); actions.refresh(); }
    }} />
</Dialog>
```

### Edit dialog: presenter-driven

A `EditRedirectDialog` component (observer) reads from `vm.editRedirect`:
```tsx
const { vm, actions } = useRedirectListPresenter();
if (!vm.editRedirect) return null;

<Dialog title="Edit Redirect" onClose={actions.hideEditDialog}>
    {vm.editRedirect.vm.loading && <OverlayLoader text={vm.editRedirect.vm.loading} />}
    <FormView name="EditRedirect" form={vm.editRedirect.vm.form} />
    <Dialog.ConfirmAction text="Save" onClick={async () => {
        const saved = await vm.editRedirect.save();
        if (saved) { actions.hideEditDialog(); actions.refresh(); }
    }} />
</Dialog>
```

Reference: `FileDetailsDrawer.tsx`

### Delete/Move: `useDeleteRedirectConfirmationDialog` / `useMoveRedirectToFolderDialog` → new hooks

Table row actions resolve hooks directly:
```tsx
const { redirect } = useRedirect();
const { openDeleteDialog } = useDeleteRedirect({ redirect });
const openMoveDialog = useMoveRedirectToFolder(redirect);
```

### Bulk actions: resolve use cases via `useFeature` / `useContainer`

---

## Phase 10: Delete Old Files

### Entire directories to delete:
- `features/redirects/loadRedirects/` (24 files)
- `features/redirects/selectRedirects/` (4 files)
- `features/redirects/getRedirect/` (1 file — replaced by new feature)
- `features/redirects/createRedirect/` (12 files)
- `features/redirects/deleteRedirect/` (11 files)
- `features/redirects/updateRedirect/` (11 files)
- `features/redirects/moveRedirect/` (10 files)

### Individual files to delete:
- `features/redirects/useGetRedirectGraphQLFields.ts`
- `modules/redirects/RedirectsList/presenters/DocumentListPresenter.ts`
- `modules/redirects/RedirectsList/presenters/DocumentListPresenterContext.tsx`
- `modules/redirects/RedirectsList/presenters/TableRowMapper.ts`
- `modules/redirects/RedirectsList/useDocumentList.ts`
- `modules/redirects/RedirectsList/hooks/useCreateRedirectDialog.tsx`
- `modules/redirects/RedirectsList/hooks/useEditRedirectDialog.tsx`
- `modules/redirects/RedirectsList/hooks/useDeleteRedirectConfirmationDialog.tsx`
- `modules/redirects/RedirectsList/hooks/useMoveRedirectToFolderDialog.tsx`
- `modules/redirects/RedirectsList/components/RedirectForm/RedirectForm.tsx` (form built by presenter via FormModelFactory)
- `domain/Redirect/redirectsCache.ts` (replaced by DI-registered cache)

### Files to update:
- `features/redirects/index.ts` — rewrite exports
- `domain/Redirect/index.ts` — remove `redirectsCache` export
- `Extension.tsx` — add `<RegisterFeature>` entries

**Estimated: ~75 files deleted, ~30 created, net reduction ~45 files.**

---

## Phase 11: Register Features in Extension.tsx

```tsx
<RegisterFeature feature={SharedRedirectCacheFeature} />
<RegisterFeature feature={ListRedirectsFeature} />
<RegisterFeature feature={GetRedirectFeature} />
<RegisterFeature feature={CreateRedirectFeature} />
<RegisterFeature feature={DeleteRedirectFeature} />
<RegisterFeature feature={UpdateRedirectFeature} />
<RegisterFeature feature={MoveRedirectFeature} />
<RegisterFeature feature={CreateRedirectPresenterFeature} />
<RegisterFeature feature={EditRedirectPresenterFeature} />
<RegisterFeature feature={RedirectListPresenterFeature} />
```

---

## Risks

1. **Table row shape**: Current table expects `TableRow` with `$type: "RECORD"|"FOLDER"`. New presenter provides separate arrays. Component maps them.

2. **ACO folder providers**: `useMoveToFolderDialog` needs ACO context. Scoped container must register `FoldersFeature`.

3. **FormView vs Bind-based form**: `RedirectForm.tsx` currently uses `<Bind>` components. New approach uses `FormView` driven by `FormModelFactory`. Verify `FormView` supports Select (with options) and Switch field types.

---

## Verification

1. `yarn build -p @webiny/app-website-builder --no-cache --safe-replace 2>&1 | tail -30`
2. `grep -rn "useApolloClient" packages/app-website-builder/src/features/redirects` — zero results
3. Smoke test: folder navigation, search, sort, filter, pagination, create/edit dialogs (FormView renders correctly), delete confirmation, move dialog, bulk actions
