# Query History Module for GraphQL Playground

## Problem

The playground has no record of past query executions. Users must remember or re-type queries they ran earlier. A history module lets users browse, search, and restore past queries.

## Decisions

- **Trigger**: record on execution only (success or failure).
- **Entry data**: query, variables, endpoint, definitionId, timestamp. No response stored.
- **ID generation**: `uuid` from `@webiny/stdlib`.
- **Deduplication**: same query+variables+endpoint updates the existing entry's timestamp and moves it to the top instead of creating a duplicate.
- **Limit**: 100 entries, oldest evicted on overflow.
- **Restore**: click restores into active tab; separate button opens in a new tab.
- **Deletion**: individual delete per entry plus a "Clear all" button.
- **UI surface**: right-side Drawer (same pattern as DocsExplorer), toggled by a toolbar "History" button.

## Feature Layer — QueryHistoryRepository

Location: `features/queryHistory/`

Files: `abstractions.ts`, `QueryHistoryRepository.ts`, `feature.ts`, `index.ts`.

### IHistoryEntry

```ts
interface IHistoryEntry {
    id: string;
    query: string;
    variables: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
}
```

### IQueryHistoryRepository

```ts
interface IQueryHistoryRepository {
    record(entry: Omit<IHistoryEntry, "id" | "timestamp">): void;
    remove(id: string): void;
    clear(): void;
    getAll(): IHistoryEntry[];
}
```

- `record` generates an ID via `uuid()`, sets `Date.now()` as timestamp, deduplicates by query+variables+endpoint (updates timestamp and moves to top), evicts the oldest entry when count exceeds 100.
- `getAll()` returns entries sorted by `timestamp` descending (newest first).
- Storage key: `"graphql-playground-history"` (separate from the existing `"graphql-playground"` tab state).
- Backed by the existing `LocalStorage` abstraction from `@webiny/app`.

## Presentation Layer — QueryHistoryPresenter

Location: `presentation/QueryHistory/`

Files: `abstractions.ts`, `QueryHistoryPresenter.ts`, `feature.ts`, `index.ts`, plus `components/` folder.

### IQueryHistoryVm

```ts
interface IQueryHistoryVm {
    open: boolean;
    searchQuery: string;
    entries: IHistoryEntryVm[];
}
```

### IHistoryEntryVm

```ts
interface IHistoryEntryVm {
    id: string;
    queryPreview: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
    query: string;
    variables: string;
}
```

`queryPreview` is the first ~80 characters of the query, trimmed.

### IQueryHistoryPresenter

```ts
interface IQueryHistoryPresenter {
    readonly vm: IQueryHistoryVm;
    toggle(): void;
    setSearchQuery(query: string): void;
    remove(id: string): void;
    clear(): void;
    load(): void;
    refresh(): void;
}
```

- Depends on `QueryHistoryRepository`.
- MobX observable state.
- `load()` reads all entries from the repository into local state.
- `vm.entries` is a computed projection: filters and sorts the local entries list on every access. This keeps the drawer reactive — no stale data.
- `setSearchQuery` filters entries by case-insensitive substring match on the full query text.
- `remove` and `clear` delegate to the repository and refresh the local list.
- `refresh()` re-reads from the repository. Called by `PlaygroundPage` after each query execution to keep the drawer in sync (same bridge pattern as DocsExplorer's schema sync).

## Integration — Recording and Restoring

### PlaygroundPresenter changes

- New dependency: `QueryHistoryRepository`.
- In `executeQuery()`, capture `query`, `variables`, `endpoint`, and `definitionId` from the active tab before the async call. After the request completes (both `.then()` and `.catch()`), call `this.historyRepository.record(...)` inside its own try/catch — a history write failure must never corrupt the response or leave `isExecuting` stuck. The `record()` call runs inside `runInAction` after `tab.response` is assigned but before `tab.isExecuting` is set to false. This ensures the history entry exists in storage before the `isExecuting` transition triggers the refresh reaction in PlaygroundPage.
- Two new public methods:
  - `restoreFromHistory(query: string, variables: string)` — overwrites the active tab's query and variables only. Does not change the tab's endpoint (the user may intentionally want to run an old query against a different endpoint).
  - `restoreFromHistoryInNewTab(query: string, variables: string, endpoint: string, definitionId: string)` — creates a new tab pre-filled with the entry's data. If `definitionId` no longer exists in the tab registry (e.g. config changed), falls back to the first available definition.

### PlaygroundPage wiring

- Resolves `QueryHistoryPresenter` from DI, calls `load()` on mount.
- Passes it to the toolbar (History button) and renders `QueryHistoryDrawer`.
- Drawer's restore and new-tab actions call through to `PlaygroundPresenter`.
- After each query execution completes, calls `queryHistoryPresenter.refresh()` to keep the drawer in sync. Uses a MobX reaction on `tab.isExecuting` (true → false transition) as the trigger — same bridge-via-useEffect pattern as DocsExplorer's schema sync.

## UI Components

Location: `presentation/QueryHistory/components/`

### QueryHistoryDrawer

Same Drawer pattern as `DocsExplorerDrawer` — non-modal, right side, closes on toggle.

### QueryHistoryList

Search input at top (filters entries by query text). Scrollable entry list. "Clear all" button at the bottom.

### HistoryEntryRow

Shows: query preview (~80 chars), endpoint, relative timestamp (e.g. "2m ago"). Click the row to restore into active tab. Small "open in new tab" icon button. Small "x" delete button.

## What this does not include

- Favoriting or bookmarking.
- Response storage or diff.
- Per-tab history (all tabs share one history).
- Export or import.
