# List Presenter Migration Skill

Migrate a Webiny admin module from the old hook-based architecture (useApolloClient, useXxx hooks, static factories, global singletons) to the ListPresenter pattern (scoped DI container, MobX presenters, clean architecture feature layers).

Reference implementations:
- **FileManager**: `packages/app-file-manager/src/presentation/FileList/`
- **Redirects**: `packages/app-website-builder/src/presentation/redirects/RedirectList/`

---

## Target Architecture

```
presentation/{Module}List/
├── abstractions.ts                      # Presenter interfaces + createAbstraction
├── feature.ts                           # DI registration (presenters)
├── index.ts                             # Barrel exports
├── {Module}ListPresenter.ts             # Main presenter (composes ListPresenter + FolderTree + dialogs)
├── {Module}ListDataSource.ts            # IDataSource adapter (UseCase → ListPresenter)
├── Create{Module}Presenter.ts           # Create dialog presenter (FormModelFactory)
├── Edit{Module}Presenter.ts             # Edit dialog presenter (FormModelFactory)
├── components/
│   ├── {Module}ListPresenterProvider.tsx # React context + useXxxPresenter hook
│   ├── {Module}List.tsx                 # Entry point (scoped DI container wiring)
│   ├── DocumentList.tsx                 # Layout shell (Main + Sidebar + Dialogs)
│   ├── Create{Module}Dialog.tsx         # Create dialog (observer, reads vm.createXxx)
│   ├── Edit{Module}Dialog.tsx           # Edit dialog (observer, reads vm.editXxx)
│   ├── Main/Main.tsx                    # Main content area
│   ├── Header/                          # Search, filters toggle, create buttons
│   ├── Sidebar/Sidebar.tsx              # FolderTree (presenter-based)
│   ├── Table/Table.tsx                  # AcoTable with sort/select
│   ├── Table/Cells/                     # Cell renderers
│   ├── Table/Actions/                   # Row actions (Edit, Delete, Move)
│   ├── BulkActions/                     # Bulk delete, move
│   ├── Filters/                         # Filter components
│   ├── BottomInfoBar/                   # Pagination info
│   ├── Empty/                           # Empty state
│   └── TableRowMapper.ts               # Redirect/Folder → TableRow mapping
├── configs/
│   ├── {Module}ListConfig.tsx           # Config registry (columns, actions, filters)
│   └── Browser/                         # Config components (BulkAction, Filter, etc.)
└── hooks/
    ├── useRedirect.tsx                  # Row context (createGenericContext)
    ├── useDelete{Module}.tsx            # Delete confirmation dialog
    └── useMove{Module}ToFolder.ts       # Move-to-folder dialog

features/{module}s/
├── shared/
│   ├── abstractions.ts                  # {Module}sListCache abstraction
│   ├── feature.ts                       # SharedCacheFeature
│   ├── graphqlFields.ts                 # Shared GraphQL field selection
│   └── index.ts
├── list{Module}s/
│   ├── abstractions.ts                  # Gateway + Repository + UseCase abstractions
│   ├── List{Module}sGateway.ts          # MainGraphQLClient query
│   ├── List{Module}sRepository.ts       # Delegates to gateway
│   ├── List{Module}sUseCase.ts          # Delegates to repository
│   └── feature.ts
├── get{Module}/
│   ├── abstractions.ts                  # UseCase + Repository abstractions
│   ├── Get{Module}Repository.ts         # Cache lookup
│   ├── Get{Module}UseCase.ts            # Delegates to repository
│   └── feature.ts
├── create{Module}/
│   ├── abstractions.ts                  # Gateway + Repository + UseCase abstractions
│   ├── Create{Module}Gateway.ts         # MainGraphQLClient mutation
│   ├── Create{Module}Repository.ts      # Gateway call + cache.addItems
│   ├── Create{Module}UseCase.ts         # Delegates to repository
│   └── feature.ts
├── delete{Module}/                      # Same 3-layer pattern, cache.removeItems
├── update{Module}/                      # Same 3-layer pattern, cache.updateItems
└── move{Module}/                        # Same 3-layer pattern, cache.removeItems
```

---

## Rules

### 1. Three-Layer Feature Architecture

Every feature follows UseCase → Repository → Gateway. No exceptions.

- **Gateway**: External boundary. Uses `MainGraphQLClient`. `/* GraphQL */` template strings (no `gql` tag). `createImplementation({ dependencies: [MainGraphQLClient] })`.
- **Repository**: Domain boundary. Calls gateway, syncs cache via `runInAction`. Dependencies: `[XxxGateway, {Module}sListCache]`.
- **UseCase**: Application boundary. Delegates to repository. Dependencies: `[XxxRepository]`.

```typescript
// Gateway — calls API
class CreateRedirectGatewayImpl {
    constructor(private client: MainGraphQLClient.Interface) {}
    async execute(params) { return this.client.execute({ query, variables }); }
}

// Repository — calls gateway + syncs cache
class CreateRedirectRepositoryImpl {
    constructor(private gateway, private cache) {}
    async execute(params) {
        const result = await this.gateway.execute(params);
        runInAction(() => { this.cache.addItems([result]); });
        return result;
    }
}

// UseCase — delegates to repository
class CreateRedirectUseCaseImpl {
    constructor(private repository) {}
    async execute(params) { return this.repository.execute(params); }
}
```

### 2. Abstractions via `createAbstraction`

Every interface is registered as a DI token. Every implementation uses `createImplementation`.

```typescript
// abstractions.ts
export const CreateRedirectGateway = createAbstraction<ICreateRedirectGateway>("Module/CreateGateway");
export namespace CreateRedirectGateway { export type Interface = ICreateRedirectGateway; }

export const CreateRedirectRepository = createAbstraction<ICreateRedirectRepository>("Module/CreateRepository");
export const CreateRedirectUseCase = createAbstraction<ICreateRedirectUseCase>("Module/CreateUseCase");

// Implementation file
export const CreateRedirectGateway = GatewayAbstraction.createImplementation({
    implementation: CreateRedirectGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

### 3. Feature Registration

```typescript
export const CreateRedirectFeature = createFeature({
    name: "WebsiteBuilder/CreateRedirect",
    register(container) {
        container.register(CreateRedirectUseCase);
        container.register(CreateRedirectRepository).inSingletonScope();
        container.register(CreateRedirectGateway).inSingletonScope();
    },
    resolve(container) {
        return { useCase: container.resolve(UseCaseAbstraction) };
    }
});
```

UseCase: transient. Repository + Gateway: singleton scope.

### 4. Shared Cache

One `ListCache<Entity>` instance per module, registered via DI.

```typescript
export const RedirectsListCache = createAbstraction<IListCache<Redirect>>("RedirectsListCache");

// feature.ts
container.registerInstance(RedirectsListCache, new ListCache<Redirect>());
```

`ListCache` is from `@webiny/app-admin/features/listCache/index.js`. It's MobX-observable, shared across all mutation repositories for optimistic cache updates.

### 5. GraphQL Fields

Shared in `features/{module}s/shared/graphqlFields.ts`. Used by all gateways.

```typescript
export const REDIRECT_FIELDS = /* GraphQL */ `
    id
    location { folderId }
    createdOn
    createdBy { id displayName }
    ...
`;
```

No `gql` from `graphql-tag`. No `useApolloClient`. All gateways use `MainGraphQLClient`.

### 6. Main Presenter Composition

The main list presenter composes reusable infrastructure presenters + domain-specific dialog presenters.

**Required dependencies** (via `createImplementation`):
```typescript
dependencies: [
    ListPresenter,                // @webiny/app-admin — list state machine
    FolderTreePresenter,          // @webiny/app-aco — folder navigation
    CreateRedirectPresenter,      // Domain-specific create dialog
    EditRedirectPresenter,        // Domain-specific edit dialog
    ListRedirectsUseCase,         // For DataSource creation
    RedirectsListCache,           // For DataSource creation
    GetDescendantFoldersUseCase   // @webiny/app-aco — folder search
]
```

**vm shape** (computed):
```typescript
{
    list: IListViewModel<Entity>,           // From ListPresenter
    folders: IFolderTreeViewModel,          // From FolderTreePresenter
    createXxx: ICreatePresenter | null,     // null = dialog closed
    editXxx: IEditPresenter | null,         // null = dialog closed
    showFolders: boolean,                   // Computed: hidden during search/filter
    showingFilters: boolean                 // Toggle state
}
```

**actions** extend `IListActions` with:
- `showFilters()` / `hideFilters()`
- `showCreateDialog(folderId)` / `hideCreateDialog()`
- `showEditDialog(entityId)` / `hideEditDialog()`
- `folders: IFolderActions` (delegates to FolderTreePresenter)

### 7. DataSource Pattern

`IDataSource<Entity>` is the adapter between the domain use case and the ListPresenter.

```typescript
class XxxListDataSource implements IDataSource<Entity> {
    constructor(
        private listUseCase: IListXxxUseCase,
        private cache: IListCache<Entity>,
        private getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase
    ) {
        makeAutoObservable(this, {
            listUseCase: false,
            getDescendantFoldersUseCase: false,
            rows: computed
        });
    }

    get rows() { return this.cache.getItems(); }
    get meta() { return this._meta; }
    get loading() { return this._loading; }

    async query(params: IDataSourceQuery) {
        this._loading = true;
        this.cache.clear();
        const result = await this.listUseCase.execute({
            search: params.search,
            where: this.buildWhere(params),
            sort: params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined,
            limit: params.limit,
            after: params.cursor
        });
        runInAction(() => {
            this.cache.addItems(result.data);
            this._meta = result.meta;
            this._loading = false;
        });
    }

    async loadMore(params) { /* same but don't clear cache */ }

    private buildWhere(params) {
        // Transform folderId filter → location where clause
        // Handle root search (no location filter)
        // Handle descendant folder search
    }
}
```

Mark use case dependencies as `false` in `makeAutoObservable` — they're not observable.

### 8. Dialog Presenter Pattern

Separate presenters for Create and Edit — no mode branching.

**Create**:
- `init(folderId)` — builds fresh form, stores folderId
- `save()` → `form.submit()` → use case → returns boolean
- vm: `{ loading: string | null, form: IFormVM }`

**Edit**:
- `loadRedirect(id)` — loads entity, builds form, populates with `form.setData()`
- `save()` → `form.submit()` → use case → returns boolean
- vm: `{ redirect: Dto | null, loading: string | null, form: IFormVM }`

Forms are built via `FormModelFactory.create({ fields, layout })`. Rebuilt on each open (not reused).

### 9. Dialog Visibility

Controlled via presenter assignment on the main presenter:

```typescript
// Show: assign the presenter instance
this._createXxx = this.createXxxPresenter;
this.createXxxPresenter.init(folderId);

// Hide: null it out
this._createXxx = null;

// Component reads vm.createXxx — null means hidden
if (!vm.createXxx) return null;
```

No separate boolean state. The presenter reference IS the visibility signal.

### 10. Scoped DI Container

Entry point creates a child container with all features registered:

```typescript
const scopedContainer = useMemo(() => {
    const child = container.createChildContainer();
    SharedCacheFeature.register(child);
    FoldersFeature.register(child, { type: FOLDER_TYPE });
    FolderTreePresenterFeature.register(child);
    ListPresenterFeature.register(child);
    ListXxxFeature.register(child);
    GetXxxFeature.register(child);
    CreateXxxFeature.register(child);
    DeleteXxxFeature.register(child);
    UpdateXxxFeature.register(child);
    MoveXxxFeature.register(child);
    XxxListPresenterFeature.register(child);
    return child;
}, []);
```

Order matters: register dependencies before dependents.

### 11. Presenter Lifecycle

```typescript
const { presenter } = useFeature(XxxListPresenterFeature);

useEffect(() => {
    presenter.init({ initialFolderId: route.params.folderId || "root" });
    return () => presenter.dispose();
}, [presenter]);
```

`init()` creates DataSource, initializes ListPresenter, sets up MobX reactions.
`dispose()` cleans up reactions.

### 12. Folder Navigation

Use `FolderTreePresenter` from `@webiny/app-aco` — NOT `NavigateFolderProvider` or `useNavigateFolder`.

Sidebar renders the presenter-based `FolderTree`:
```typescript
<FolderTree
    vm={vm.folders}
    actions={actions.folders}
    folderActions={browser.folder.actions}
/>
```

Import from `@webiny/app-aco/presentation/folderTree/FolderTree.js`.

Folder row click in tables: `actions.folders.selectFolder(folderId)` — not `navigateToFolder`.

### 13. Delete/Move Hooks

Simple hooks — NOT part of any presenter. Resolve use cases from container.

```typescript
// useDeleteXxx
const container = useContainer();
const deleteUseCase = container.resolve(DeleteXxxUseCase);
const { showConfirmation } = useConfirmationDialog({ title, message });
return { openDeleteDialog: () => showConfirmation(() => deleteUseCase.execute({ id })) };

// useMoveXxxToFolder
const moveUseCase = container.resolve(MoveXxxUseCase);
const { showDialog } = useMoveToFolderDialog();
return () => showDialog({ focusedFolderId, onAccept: ({ folder }) => moveUseCase.execute({ id, folderId: folder.id }) });
```

`useMoveToFolderDialog` from `@webiny/app-aco` works via DI — no providers needed.

### 14. Table Row Mapping

The presenter provides separate arrays: `vm.list.rows` (entities) + `vm.folders.childFolders` (folders). The Table component composes them:

```typescript
const data = useMemo(() => {
    const entityRows = vm.list.rows.map(r => TableRowMapper.fromEntity(r));
    if (!vm.showFolders) return entityRows;
    const folderRows = (vm.folders.childFolders ?? []).map(f => TableRowMapper.fromFolder(f));
    return [...folderRows, ...entityRows];
}, [vm.list.rows, vm.folders.childFolders, vm.showFolders]);
```

`TableRowMapper` produces `{ id, $type: "RECORD"|"FOLDER", $selectable, data }` objects for AcoTable.

### 15. Observer Wrapping

All components that read from presenter `vm` MUST be wrapped with `observer` from `mobx-react-lite`:

```typescript
export const Main = observer(() => {
    const { vm, actions } = useXxxListPresenter();
    // ...
});
```

---

## Anti-Patterns to Avoid

1. **No `useApolloClient`** — use `MainGraphQLClient` via DI
2. **No `gql` from `graphql-tag`** — use `/* GraphQL */` template strings
3. **No `NavigateFolderProvider` / `useNavigateFolder`** — use `FolderTreePresenter`
4. **No `FoldersProvider`** — use `FoldersFeature` registered in scoped container
5. **No global singleton caches** — register via DI (`container.registerInstance`)
6. **No static factory classes** (`Xxx.getInstance()`) — use DI features
7. **No per-operation hooks** (`useLoadXxx`, `useSearchXxx`, `useSortXxx`) — ListPresenter handles all
8. **No `useSelectXxx` hooks** — ListPresenter has built-in SelectionController
9. **No `loadingRepositoryFactory` / `metaRepositoryFactory` / `sortRepositoryFactory`** — ListPresenter manages all state internally
10. **No mode branching in dialog presenters** — separate Create and Edit presenters
11. **No `UseCaseWithLoading` decorators** — ListPresenter tracks list loading; dialog presenters track their own loading

---

## Migration Checklist

- [ ] Create `features/{module}s/shared/` (cache abstraction + feature + graphqlFields)
- [ ] Create `features/{module}s/list{Module}s/` (3-layer: Gateway + Repository + UseCase + feature)
- [ ] Create `features/{module}s/get{Module}/` (Repository reads from cache + UseCase + feature)
- [ ] Create `features/{module}s/create{Module}/` (3-layer with cache.addItems in repository)
- [ ] Create `features/{module}s/delete{Module}/` (3-layer with cache.removeItems in repository)
- [ ] Create `features/{module}s/update{Module}/` (3-layer with cache.updateItems in repository)
- [ ] Create `features/{module}s/move{Module}/` (3-layer with cache.removeItems in repository)
- [ ] Create `presentation/{module}s/{Module}List/abstractions.ts`
- [ ] Create DataSource (`{Module}ListDataSource.ts`)
- [ ] Create Create presenter (`Create{Module}Presenter.ts`)
- [ ] Create Edit presenter (`Edit{Module}Presenter.ts`)
- [ ] Create main presenter (`{Module}ListPresenter.ts`)
- [ ] Create feature (`feature.ts` — registers all 3 presenters)
- [ ] Create provider (`{Module}ListPresenterProvider.tsx`)
- [ ] Create entry point (`{Module}List.tsx` — scoped DI container)
- [ ] Create dialog components (`Create{Module}Dialog.tsx`, `Edit{Module}Dialog.tsx`)
- [ ] Create hooks (`useDelete{Module}.tsx`, `useMove{Module}ToFolder.ts`)
- [ ] Migrate UI components to read from presenter
- [ ] Delete old files (hooks, factories, old presenters, old dialog hooks)
- [ ] Verify build passes
- [ ] Verify zero `useApolloClient` references
- [ ] Smoke test all CRUD operations + folder navigation + search/sort/filter
