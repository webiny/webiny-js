## Summary

Custom GraphQL Playground replacing the old CDN-loaded `graphql-playground-react`. Built from scratch with Monaco Editor, MobX presenter, raw-fetch GraphQL clients, localStorage persistence, and `graphql-language-service` autocomplete.

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

### Test coverage

- 47 tests across 3 test files (presenter, repository, prettifier)
- Presenter tests cover: init, tab CRUD, query/variables/headers/endpoint updates, execution, prettify, copy, schema loading, bottom panel, registered tab protection
- Repository tests cover: load/save round-trip, empty state, partial state
- Prettifier tests cover: formatting, standalone/trailing/top-level comment preservation, indentation matching, invalid input

### What's next (v2)

- Docs explorer sidebar
- Query history
- Browser manual testing (not yet done)
