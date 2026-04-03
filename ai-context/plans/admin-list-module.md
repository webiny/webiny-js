# Plan: Generic List Module Factory

> Source PRD: `ai-context/plans/list-module/list-module-plan.md`

## Architectural decisions

- **Package**: `packages/app-admin` — generic, widely reusable infrastructure; belongs in core admin alongside other foundational abstractions
- **State**: MobX (`makeAutoObservable`) for reactive repositories and presenter
- **DI**: React Context + `createListModule()` factory; no traditional DI container
- **UI shape**: Columns, filters, bulk actions, and entry actions are declared via JSX using the react-properties pattern (same as `ContentEntriesModule.tsx`) — NOT in the factory config
- **Key models**: `ListGateway<TDto, TParams>`, `ListMapper<TDto, TEntity>`, `ListViewModel<TEntity>`, `ListActions<TParams>`
- **Pagination**: cursor-based (`cursor: string | null`, `hasMore: boolean`)
- **Params base type**: `BaseListParams { search?, sort?, cursor?, limit? }`

---

## Phase 1: MVP — Full-Stack Data Load

**User stories**: As a developer, I can call `createListModule()` with a Gateway and Mapper and get a React hook that fetches and renders a list of items end-to-end.

### What to build

A thin vertical slice from GraphQL response all the way to a React component. No filtering, sorting, or search — just load data and expose it reactively.

Contracts to define:
- `BaseListParams`, `ListResponse<TDto>`
- `ListGateway<TDto, TParams>` (single method: `fetchList(params): Promise<ListResponse<TDto>>`)
- `ListMapper<TDto, TEntity>` (single method: `toDomain(dto): TEntity`)
- `ListViewModel<TEntity>` (fields: `items`, `isInitialLoading`, `isLoading`, `error`)
- `ListModuleConfig` (runtime knobs only: `name`, `gateway`, `mapper`, `initialParams`)

Repositories to implement:
- `ListQueryParamsRepository` — holds current params, supports `get()` and `reset()`
- `ListDataRepository` — holds `items[]`, `cursor`, `hasMore`, `total`
- `LoadingRepository` — tracks `isInitialLoading`, `isLoading`

Presenter + factory:
- `GenericListPresenter` — computes `ListViewModel` from repositories, exposes `init()` and `dispose()`
- `createListModule()` — wires gateway → mapper → repositories → presenter, returns `{ useListModule }`

React layer:
- `useListModule` hook — returns `{ vm, actions }` (actions is minimal: just `refresh()` and `reset()`)
- `ListModuleContext` — React context holding the presenter instance

Example module to validate the slice:
- `PagesGateway` implementing `ListGateway` against the Pages GraphQL API
- `PageMapper` implementing `ListMapper`
- A minimal React component consuming `useListModule` and rendering a list

### Acceptance criteria

- [ ] `createListModule({ name, gateway, mapper, config })` returns a working hook with no other configuration
- [ ] `useListModule()` returns `vm.items` populated after initial fetch
- [ ] `vm.isInitialLoading` is `true` before first fetch completes, `false` after
- [ ] `vm.error` is set when the gateway throws
- [ ] Unmounting the component disposes the presenter (no memory leaks)
- [ ] Integration test: mock gateway → mount hook → `vm.items` matches gateway response
- [ ] `PagesGateway` + `PageMapper` example compiles and renders real data

---

## Phase 2: Search

**User stories**: As a user, I can type in a search box and the list re-fetches with the updated query.

### What to build

Add `SearchFeature` on top of the Phase 1 foundation. Wire search into `ListQueryParamsRepository` and expose it in VM and actions.

- `SearchFeature` — calls `paramsRepo.set("search", value)` with configurable debounce
- `ListViewModel` gains: `search: string`
- `ListActions` gains: `search: { set(query): void; clear(): void }`
- `ListModuleConfig` gains: `config.search?: { debounceMs?, minLength? }`

### Acceptance criteria

- [ ] `actions.search.set("foo")` triggers a re-fetch with `params.search = "foo"` after debounce
- [ ] `actions.search.clear()` resets search and re-fetches
- [ ] Changing search resets cursor to `null`
- [ ] Debounce is configurable; default is 300ms
- [ ] Unit test: rapid `set()` calls result in one fetch after debounce settles

---

## Phase 3: Sort

**User stories**: As a user, I can click a column header to sort the list; clicking again toggles direction.

### What to build

Add `SortFeature` with a toggle cycle: none → asc → desc → none.

- `SortFeature` — manages sort state in `ListQueryParamsRepository`
- `ListViewModel` gains: `sort: SortParams | null`
- `ListActions` gains: `sort: { set(by, direction): void; toggle(by): void; clear(): void }`

### Acceptance criteria

- [ ] `actions.sort.toggle("title")` cycles none → asc → desc → none
- [ ] `actions.sort.set("title", "asc")` sets sort directly
- [ ] Changing sort resets cursor to `null` and triggers re-fetch
- [ ] `vm.sort` reflects current sort state

---

## Phase 4: Filters

**User stories**: As a user, I can apply one or more filters and the list re-fetches with matching results.

### What to build

Add `FilterFeature` for type-safe key/value filter management.

- `FilterFeature` — `set(key, value)`, `clear(key)`, `clearAll()`, `replace(filters)`
- `ListViewModel` gains: `filters: Record<string, unknown>`, `hasActiveFilters: boolean`, `isEmptyWithFilters: boolean`
- `ListActions` gains: `filter: FilterActions<TParams>`

### Acceptance criteria

- [ ] `actions.filter.set("status", "published")` re-fetches with updated params
- [ ] `actions.filter.clearAll()` resets all filters and re-fetches
- [ ] `vm.hasActiveFilters` is `true` when any filter differs from `initialParams`
- [ ] `vm.isEmptyWithFilters` is `true` when `items` is empty AND `hasActiveFilters` is `true`
- [ ] Changing any filter resets cursor to `null`

---

## Phase 5: Pagination (Load More)

**User stories**: As a user, I can click "Load more" to append the next page of results.

### What to build

Add `LoadMoreFeature` with cursor-based pagination.

- `LoadMoreFeature` — calls gateway with current cursor, appends results to `ListDataRepository`
- `ListViewModel` gains: `hasMore: boolean`, `cursor: string | null`, `isLoadingMore: boolean`
- `ListActions` gains: `loadMore(): Promise<void>`

### Acceptance criteria

- [ ] `actions.loadMore()` appends items to `vm.items` (does not replace)
- [ ] `vm.hasMore` is `false` when gateway returns `hasMore: false`
- [ ] `vm.isLoadingMore` is `true` during the load-more fetch
- [ ] Calling `loadMore()` while already loading is a no-op
- [ ] Changing search/sort/filters resets accumulated items and cursor

---

## Phase 6: Selection + Bulk Actions

**User stories**: As a user, I can select items across pages and trigger a bulk action on them.

### What to build

Add `SelectionRepository`, `SelectionFeature`, and `BulkActionsFeature`. Selection is opt-in via config.

- `SelectionRepository` — holds `Set<string>` of selected IDs
- `SelectionFeature` — toggle, select, deselect, selectAll, selectPage, deselectAll
- `BulkActionsFeature` — execute named action with selected IDs; tracks executing state per action
- `ListViewModel` gains: `selection: SelectionState`
- `ListActions` gains: `selection: SelectionActions`, `bulk: BulkActions`
- `ListModuleConfig` gains: `config.selection?: { enabled: boolean }`

### Acceptance criteria

- [ ] Selected IDs persist when `loadMore()` appends new items
- [ ] `vm.selection.isAllSelected` is `true` only when all loaded items are selected
- [ ] `vm.selection.isPartiallySelected` is `true` when some but not all are selected
- [ ] `actions.bulk.execute("delete")` is called with the current selected IDs
- [ ] `vm.selection.count` reflects number of selected items
- [ ] Selection is absent from VM when `config.selection.enabled` is `false`

---

## Phase 7: Error Handling

**User stories**: As a user, I see a clear error message when loading fails, and I can retry.

### What to build

Harden all async paths with structured error state. Distinguish network/API errors from empty states.

- `ListError { code, message, retryable }` added to `ListViewModel`
- Retry logic in presenter: re-runs last fetch with same params
- `ListActions` gains: `refresh(): Promise<void>` (already in Phase 1 but now retries after error)
- Empty state distinction: `isEmpty` (no data ever) vs `isEmptyWithFilters` (data exists but filtered out)

### Acceptance criteria

- [ ] `vm.error` is set when gateway rejects; loading state is cleared
- [ ] `vm.error.retryable` is `true` for network errors, `false` for 4xx-class errors
- [ ] `actions.refresh()` clears error and re-fetches
- [ ] `vm.isEmpty` and `vm.isEmptyWithFilters` are mutually exclusive
- [ ] Loading state and error state never both `true` simultaneously
