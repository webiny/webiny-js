## Summary

Custom GraphQL Playground replacing the old CDN-loaded `graphql-playground-react`. Built from scratch with Monaco Editor, MobX presenter, raw-fetch GraphQL clients, localStorage persistence, and `graphql-language-service` autocomplete. Includes a schema docs explorer and query history module.

### What changed

- **`packages/app-graphql-playground`** — complete rewrite using 3-layer architecture (Presenter / Repository / Gateway):
  - `PlaygroundPresenter` — MobX-powered state management for tabs, query execution, introspection, and schema autocomplete
  - `PlaygroundRepository` — localStorage persistence for tab state (queries, variables, active tab — headers excluded for security)
  - `PlaygroundTabRegistry` — DI-based tab registration, allowing any package to contribute playground tabs
  - `PlaygroundClient` / `AuthenticatedPlaygroundClient` — raw `fetch`-based per-tab GraphQL clients with auth token and tenant headers
  - `PlaygroundClientFactory` / `AuthenticatedPlaygroundClientFactory` — DI-wirable factories for creating clients. Default implementations handle auth tokens and tenant headers, but consumers can provide their own `getToken` / `getTenant` overrides, or implement `PlaygroundClient.Interface` from scratch for full control
  - 10 React components (arrow functions, no `React.FC`), 2 hooks (`useMonacoGraphQL`, `useResizableSplit`)
  - Comment-preserving GraphQL prettifier (extracts comments from token linked list, formats with `parse`/`print`, reinserts via token alignment)
  - Endpoint field is read-only on registered (system) tabs — users duplicate to get an editable copy
  - Endpoint selector popup clamped to viewport bounds

- **Schema Docs Explorer** — right-side drawer for browsing introspected schema:
  - `DocsExplorerPresenter` — MobX presenter with stack-based type navigation, search, and schema parsing
  - Deep root search — matches type names, field names, argument names, input fields, and enum values across all types. Results show a `matchContext` annotation (e.g. "field: title") explaining why a type matched
  - 4 UI components: `DocsExplorerDrawer`, `DocsRootView`, `DocsTypeView`, `DocsTypeRef`
  - Cyclic navigation dedup (revisiting a type pops back instead of pushing)
  - Scalars are not navigable; all other type kinds are clickable

- **Query History** — localStorage-backed execution history:
  - `QueryHistoryRepository` — capped at 100 entries, deduplicates by query+variables+endpoint (updates timestamp and moves to top), sorted newest-first
  - `QueryHistoryPresenter` — MobX presenter with toggle, search filter, remove, clear, load, refresh
  - `PlaygroundPresenter` integration — records on every execution (success or failure) inside try/catch before `isExecuting` flips to false. Two restore methods: `restoreFromHistory` (overwrites active tab) and `restoreFromHistoryInNewTab` (creates new tab with fallback if `definitionId` is unknown)
  - 3 UI components: `QueryHistoryDrawer`, `QueryHistoryList`, `HistoryEntryRow` with relative timestamps, click-to-restore, open-in-new-tab, and individual delete
  - PlaygroundPage refresh bridge via MobX reaction on `isExecuting` transition

- **`packages/app-headless-cms`** — CMS tabs (Manage, Read, Preview APIs) contributed via DI decorator (`CmsPlaygroundTabsDecorator`), old `apiInformation` plugin deleted

- **`packages/app-serverless-cms`** — removed `createApolloClient` prop from `<GraphQLPlayground>`

- **`packages/webiny`** — re-exports for `PlaygroundTabRegistry`, `PlaygroundClientFactory`, and `AuthenticatedPlaygroundClientFactory`

### Design decisions

- **Each tab provider brings its own `PlaygroundClient`** — the playground shell is generic, tab providers own auth/tenant logic via factories
- **Registered tabs are permanent, user-created tabs are closable** — registered tab endpoints are read-only to prevent accidental drift
- **Headers are not persisted** to localStorage (security)
- **No permissions on playground access** — intentional, matches existing behavior
- **`graphql-language-service` for autocomplete** instead of `monaco-graphql` — CDN-loaded Monaco is incompatible with `monaco-graphql`
- **Endpoint introspection debounced 1s** on user-created tab endpoint edits
- **Factories for client creation** — `PlaygroundClientFactory` creates a basic client (raw fetch + auth token), `AuthenticatedPlaygroundClientFactory` wraps it with tenant headers. Both accept optional overrides. For fully custom clients, implement `PlaygroundClient.Interface` directly.
- **DocsExplorer decoupled from PlaygroundPresenter** — bridged via useEffect in PlaygroundPage, reacts to schema/status changes
- **History recording is fire-and-forget** — try/catch around localStorage writes ensures a quota error never corrupts the query response or leaves `isExecuting` stuck
- **Both drawers (Docs + History) can open simultaneously** — no mutual exclusion, consistent behavior

### Test coverage

- 101 tests across 6 test files
- PlaygroundPresenter: init, tab CRUD, query/variables/headers/endpoint updates, execution, prettify, copy, schema loading, bottom panel, registered tab protection, history recording on success/failure, history write resilience, restoreFromHistory, restoreFromHistoryInNewTab with unknown definitionId fallback
- PlaygroundRepository: load/save round-trip, empty state, partial state
- Prettifier: formatting, standalone/trailing/top-level comment preservation, indentation matching, invalid input
- DocsExplorerPresenter: toggle, schema status, root view sections, type navigation, breadcrumbs, cyclic dedup, INPUT_OBJECT/ENUM types, search by name, deep search by field/arg/enum/input, matchContext annotation, navigability
- QueryHistoryRepository: record with id/timestamp, sort order, dedup, eviction at 100, remove, clear, cross-instance persistence
- QueryHistoryPresenter: toggle, load, queryPreview, refresh, search filter, remove, clear

### What's next

- Browser manual testing (not yet done)
- Consider making `pendingIntrospections` observable for reliable loading spinner
- Add UNION/INTERFACE test coverage for DocsExplorer
