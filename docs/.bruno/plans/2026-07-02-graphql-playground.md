# GraphQL Playground — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the external CDN-loaded GraphQL Playground with a fully custom, DI-wired implementation built on Monaco Editor, with tab management, localStorage persistence, and schema-driven autocomplete.

**Architecture:** Three-layer pattern (abstractions → presenter/repository/gateway → React view). Each tab provider registers a `PlaygroundTabDefinition` that includes a `PlaygroundClient` implementation — a raw-fetch wrapper responsible for its own auth, tenant headers, and endpoint. The playground shell is completely generic: it calls `client.execute()` and renders whatever comes back. The playground package owns the core feature and the Main API tab; `app-headless-cms` decorates the tab registry to contribute CMS tabs.

**Tech Stack:** TypeScript, React, MobX (`makeAutoObservable`), Monaco Editor (`@monaco-editor/react`), `graphql-language-service` (autocomplete), `@webiny/admin-ui` (Button, Loader, Tabs), `@webiny/feature/admin` (DI), `@webiny/di` (createImplementation/createDecorator), Tailwind for layout.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package | Delete + recreate `app-graphql-playground` | Clean slate, same package name |
| Editor | Monaco | Already in repo via `app-sdk-playground` |
| GraphQL client | `PlaygroundClient` per tab (raw fetch) | Each tab provider brings its own client with auth/tenant; playground is generic |
| Tab config | DI-based `PlaygroundTabRegistry` + decorator pattern | Modules contribute tabs without coupling |
| Tab behavior | Registered tabs are permanent (can't be closed); user-created tabs are closable | Always-visible registered tabs, flexible user tabs |
| Persistence | localStorage: query, variables, tab list/order per user tab | Not responses, not headers (security) |
| Schema | Introspection → `graphql-language-service` → Monaco `CompletionItemProvider`, no docs explorer in v1 | `monaco-graphql` requires ESM + worker, incompatible with CDN-loaded Monaco |
| Response | Read-only Monaco | Syntax highlighting, folding, search for free |
| Layout | Vertical split (query left, response right), resizable | Variables/headers as collapsible sub-tabs below query |
| History | None in v1 | Tabs already persist queries |
| Errors | Everything in response editor | No toasts, playground is a raw tool |
| Styling | `admin-ui` components + Tailwind | Same as SDK playground |
| Route | `/api-playground` | Same as current |
| Toolbar | Execute + Prettify + Copy Query + Copy Response | |
| Shortcuts | Cmd/Ctrl+Enter to execute | |
| Permissions | None | If you can access admin, you can use the playground |
| Auth | Tab provider's responsibility | Each `PlaygroundClient` adds its own auth/tenant headers |
| Endpoint editing | Editable per tab | `PlaygroundClient.execute()` accepts an endpoint override |

---

## File Map

### Deleted files (entire old `src/` contents)
- `packages/app-graphql-playground/src/plugins/Playground.tsx`
- `packages/app-graphql-playground/src/plugins/Playground.styles.ts`
- `packages/app-graphql-playground/src/plugins/constants.ts`
- `packages/app-graphql-playground/src/plugins/settings.ts`
- `packages/app-graphql-playground/src/plugins/index.tsx`
- `packages/app-graphql-playground/src/plugins/placeholder.graphql`
- `packages/app-graphql-playground/src/types.ts`

### Kept files (modified)
- `packages/app-graphql-playground/package.json` — remove apollo/emotion/load-script/`@webiny/plugins` deps, add `@monaco-editor/react`, `monaco-editor`, `@webiny/di`, `mobx`, `mobx-react-lite`, `graphql-language-service`
- `packages/app-graphql-playground/src/index.tsx` — rewrite entry point, remove apollo client prop, register DI features via `createFeature` + `<RegisterFeature>`
- `packages/app-graphql-playground/src/routes.ts` — keep as-is
- `packages/app-graphql-playground/src/PermissionsSchema.ts` — keep as-is
- `packages/app-graphql-playground/src/SecurityPermission.tsx` — keep as-is

### New files — features layer
- `packages/app-graphql-playground/src/features/playgroundClient/abstractions.ts` — `PlaygroundClient` abstraction (raw fetch interface)
- `packages/app-graphql-playground/src/features/playgroundClient/PlaygroundClient.ts` — default implementation (raw fetch with auth), used by Main API tab
- `packages/app-graphql-playground/src/features/playgroundClient/index.ts` — public exports
- `packages/app-graphql-playground/src/features/tabRegistry/abstractions.ts` — `PlaygroundTabRegistry` abstraction + `PlaygroundTabDefinition` type
- `packages/app-graphql-playground/src/features/tabRegistry/PlaygroundTabRegistry.ts` — default impl with `createImplementation`, returns Main API tab
- `packages/app-graphql-playground/src/features/tabRegistry/feature.ts` — `createFeature` wiring
- `packages/app-graphql-playground/src/features/tabRegistry/index.ts` — public exports
- `packages/app-graphql-playground/src/features/repository/abstractions.ts` — `PlaygroundRepository` abstraction
- `packages/app-graphql-playground/src/features/repository/PlaygroundRepository.ts` — localStorage impl with deployment-scoped key
- `packages/app-graphql-playground/src/features/repository/feature.ts` — `createFeature` wiring
- `packages/app-graphql-playground/src/features/repository/index.ts` — public exports

### New files — presentation layer
- `packages/app-graphql-playground/src/presentation/Playground/abstractions.ts` — `PlaygroundPresenter` abstraction
- `packages/app-graphql-playground/src/presentation/Playground/PlaygroundPresenter.ts` — MobX presenter with `createImplementation`, owns all state
- `packages/app-graphql-playground/src/presentation/Playground/feature.ts` — `createFeature` wiring
- `packages/app-graphql-playground/src/presentation/Playground/index.ts` — public exports
- `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundPage.tsx` — top-level component, injects presenter via `useFeature`
- `packages/app-graphql-playground/src/presentation/Playground/components/TabBar.tsx` — tab strip with add/close + right-click context menu (duplicate/rename)
- `packages/app-graphql-playground/src/presentation/Playground/components/QueryEditor.tsx` — Monaco editor for GraphQL queries
- `packages/app-graphql-playground/src/presentation/Playground/components/ResponseEditor.tsx` — read-only Monaco for responses
- `packages/app-graphql-playground/src/presentation/Playground/components/BottomPanel.tsx` — collapsible sub-tabs for variables/headers
- `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundToolbar.tsx` — Execute/Prettify/Copy Query/Copy Response buttons
- `packages/app-graphql-playground/src/presentation/Playground/components/EndpointSelector.tsx` — dropdown to pick endpoint when creating a new tab
- `packages/app-graphql-playground/src/presentation/Playground/components/TabContextMenu.tsx` — right-click menu for duplicate/rename
- `packages/app-graphql-playground/src/presentation/Playground/hooks/useResizableSplit.ts` — adapted from SDK playground
- `packages/app-graphql-playground/src/presentation/Playground/hooks/useMonacoGraphQL.ts` — Monaco setup with GraphQL syntax + `graphql-language-service` autocomplete

### New files — tests
- `packages/app-graphql-playground/__tests__/PlaygroundPresenter.test.ts` — presenter unit tests
- `packages/app-graphql-playground/__tests__/PlaygroundRepository.test.ts` — repository unit tests

### Modified files — consumers
- `packages/app-headless-cms/src/admin/plugins/apiInformation/index.tsx` — delete file
- `packages/app-headless-cms/src/HeadlessCMS.tsx` — remove `apiInformation` import and `plugins.register()` call
- `packages/app-headless-cms/src/admin/features/playgroundTabs/CmsPlaygroundTabs.ts` — decorator that adds CMS tabs
- `packages/app-headless-cms/src/admin/features/playgroundTabs/CmsPlaygroundClient.ts` — raw-fetch client for CMS endpoints
- `packages/app-headless-cms/src/admin/features/playgroundTabs/feature.ts` — DI wiring
- `packages/app-headless-cms/src/admin/features/playgroundTabs/index.ts` — public exports
- `packages/app-headless-cms/src/admin/features/playgroundTabs/queries/` — move placeholder query files here from `plugins/apiInformation/`
- `packages/app-serverless-cms/src/Admin.tsx` — remove `createApolloClient` prop from `<GraphQLPlayground>`

---

## Data Model

### PlaygroundClient interface (each tab provider implements this)
```typescript
interface IPlaygroundClient {
    execute(params: {
        query: string;
        endpoint?: string;
        variables?: Record<string, any>;
        headers?: Record<string, string>;
    }): Promise<Record<string, any>>;
}
```
Returns parsed JSON (the full wire response: `{ data, errors, extensions }`). The presenter stringifies for display. The `endpoint` param overrides the client's default endpoint when the user edits it in the UI. Auth, tenant, and default headers are the client's responsibility. User-typed headers are passed via `headers` — the client should let them take priority.

### PlaygroundTabDefinition (from tab registry)
```typescript
interface PlaygroundTabDefinition {
    id: string;
    name: string;
    endpoint: string;
    client: PlaygroundClient.Interface;
    defaultQuery: string;
}
```
`endpoint` is the display/default endpoint (e.g., `/graphql`, `/cms/manage`). `client` is the raw-fetch implementation for this endpoint.

### PlaygroundTab (runtime state, managed by presenter)
```typescript
interface PlaygroundTab {
    id: string;
    definitionId: string;
    name: string;
    endpoint: string;
    query: string;
    variables: string;
    headers: string;
    response: string;
    isExecuting: boolean;
    isRegistered: boolean;
    activeBottomPanel: "variables" | "headers";
    isBottomPanelCollapsed: boolean;
}
```
`isRegistered` — `true` for tabs from DI providers (permanent, can't be closed), `false` for user-created tabs. `definitionId` links back to the `PlaygroundTabDefinition.id` to resolve the client.

### localStorage schema
Key: `webiny:<deploymentId>:graphql-playground` (scoped per deployment)
```typescript
interface PersistedState {
    activeTabId: string;
    registeredTabs: Array<{
        definitionId: string;
        query: string;
        variables: string;
    }>;
    userTabs: Array<{
        id: string;
        definitionId: string;
        name: string;
        endpoint: string;
        query: string;
        variables: string;
    }>;
}
```
Headers are NOT persisted (security). Registered tabs persist only query and variables — name/endpoint/client come from DI on every init. User tabs persist everything except headers and response.

---

## Task 1: Delete old package contents, scaffold new package.json

**Files:**
- Delete: all files under `src/plugins/`, `src/types.ts`
- Modify: `packages/app-graphql-playground/package.json`

- [ ] **Step 1.1:** Delete old source files:
  - `src/plugins/Playground.tsx`
  - `src/plugins/Playground.styles.ts`
  - `src/plugins/constants.ts`
  - `src/plugins/settings.ts`
  - `src/plugins/index.tsx`
  - `src/plugins/placeholder.graphql`
  - `src/types.ts`

- [ ] **Step 1.2:** Update `package.json`:
  - Remove: `@emotion/react`, `@emotion/styled`, `apollo-cache`, `apollo-client`, `apollo-link`, `apollo-link-context`, `apollo-utilities`, `load-script`, `@webiny/plugins`
  - Add: `@monaco-editor/react` (^4.7.0), `monaco-editor` (0.53.0), `@webiny/di`, `@webiny/feature`, `mobx`, `mobx-react-lite`, `graphql-language-service`
  - Keep: `@webiny/admin-ui`, `@webiny/app`, `@webiny/app-admin`, `@webiny/icons`, `graphql`, `react`, `react-dom`
  - Remove `adio.ignore` entry for `raw-loader`

---

## Task 2: PlaygroundClient — abstraction + default implementation

**Files:**
- New: `src/features/playgroundClient/abstractions.ts`
- New: `src/features/playgroundClient/PlaygroundClient.ts`
- New: `src/features/playgroundClient/index.ts`

- [ ] **Step 2.1:** Create `abstractions.ts` — define `IPlaygroundClient` interface and `PlaygroundClient` abstraction via `createAbstraction`. Use the namespace pattern:
  ```typescript
  export const PlaygroundClient = createAbstraction<IPlaygroundClient>("PlaygroundClient");
  export namespace PlaygroundClient {
      export type Interface = IPlaygroundClient;
      export type Request = PlaygroundClientRequest;
  }
  ```
  Note: `PlaygroundClient` is NOT a singleton DI service — it's an interface that tab providers implement directly. No `createImplementation` here.

- [ ] **Step 2.2:** Create `PlaygroundClient.ts` — default `PlaygroundClientImpl` class using raw `fetch`. Constructor takes a default endpoint URL and an auth token provider function (`() => Promise<string | null>`). The `execute()` method:
  - Uses `endpoint` param if provided, otherwise the default.
  - Adds `Authorization: Bearer <token>` and `Content-Type: application/json` headers.
  - Merges user-typed headers with priority (user headers override defaults).
  - POSTs `{ query, variables }` as JSON.
  - Returns the parsed JSON response as-is (full envelope).
  - On network error, returns `{ errors: [{ message: "..." }] }` instead of throwing.

- [ ] **Step 2.3:** Create `index.ts` — export the abstraction and the default implementation class.

---

## Task 3: Tab registry — abstraction + default implementation

**Files:**
- New: `src/features/tabRegistry/abstractions.ts`
- New: `src/features/tabRegistry/PlaygroundTabRegistry.ts`
- New: `src/features/tabRegistry/feature.ts`
- New: `src/features/tabRegistry/index.ts`

- [ ] **Step 3.1:** Create `abstractions.ts` — define `PlaygroundTabDefinition` interface and `PlaygroundTabRegistry` abstraction via `createAbstraction`:
  ```typescript
  export const PlaygroundTabRegistry = createAbstraction<IPlaygroundTabRegistry>("PlaygroundTabRegistry");
  export namespace PlaygroundTabRegistry {
      export type Interface = IPlaygroundTabRegistry;
      export type TabDefinition = PlaygroundTabDefinition;
  }
  ```
  The registry has a single method: `getTabs(): PlaygroundTabDefinition[]`.

- [ ] **Step 3.2:** Create `PlaygroundTabRegistry.ts` — `PlaygroundTabRegistryImpl` with `createImplementation` in the same file. Returns a single Main API tab:
  ```typescript
  { id: "main-api", name: "Main API", endpoint: `${apiUrl}/graphql`, client: new PlaygroundClientImpl(...), defaultQuery: "..." }
  ```
  Dependencies: `[EnvConfig]`. Gets auth token from the DI context (depends on an auth token provider abstraction, or instantiates `PlaygroundClientImpl` with a token getter).

- [ ] **Step 3.3:** Create `feature.ts` using `createFeature` — registers `PlaygroundTabRegistryImpl` into the container. Create `index.ts` with public exports (abstraction + types only).

---

## Task 4: Repository — abstraction + implementation

**Files:**
- New: `src/features/repository/abstractions.ts`
- New: `src/features/repository/PlaygroundRepository.ts`
- New: `src/features/repository/feature.ts`
- New: `src/features/repository/index.ts`

- [ ] **Step 4.1:** Create `abstractions.ts` — define `IPlaygroundRepository` interface and `PlaygroundRepository` abstraction via `createAbstraction`. Methods:
  - `load(): PersistedState | null`
  - `save(state: PersistedState): void`
  Use the namespace pattern with `PersistedState` as a dependent type.

- [ ] **Step 4.2:** Create `PlaygroundRepository.ts` — `PlaygroundRepositoryImpl` with `createImplementation`. Uses a deployment-scoped localStorage key (e.g., `webiny:<deploymentId>:graphql-playground`). Dependencies: `[EnvConfig]` (to get the deployment ID for key scoping).

- [ ] **Step 4.3:** Create `feature.ts` using `createFeature`. Create `index.ts` with public exports.

---

## Task 5: Presenter (state management)

**Files:**
- New: `src/presentation/Playground/abstractions.ts`
- New: `src/presentation/Playground/PlaygroundPresenter.ts`
- New: `src/presentation/Playground/feature.ts`
- New: `src/presentation/Playground/index.ts`

- [ ] **Step 5.1:** Create `abstractions.ts` — define `PlaygroundPresenter` abstraction with:
  - `vm` getter returning the MobX-observable view model:
    ```typescript
    interface PlaygroundVm {
        tabs: PlaygroundTabVm[];
        activeTabId: string;
        activeTab: PlaygroundTabVm;
        endpoints: EndpointVm[];
    }
    ```
  - Methods: `init()`, `selectTab(id)`, `createTab(definitionId)`, `closeTab(id)`, `duplicateTab(id)`, `renameTab(id, name)`, `updateQuery(query)`, `updateVariables(variables)`, `updateHeaders(headers)`, `updateEndpoint(endpoint)`, `executeQuery()`, `prettifyQuery()`, `copyQuery()`, `copyResponse()`, `selectBottomPanel(panel)`, `toggleBottomPanel()`

- [ ] **Step 5.2:** Create `PlaygroundPresenter.ts` — `PlaygroundPresenterImpl` with `createImplementation`, MobX observable state:
  - Dependencies: `[PlaygroundTabRegistry, PlaygroundRepository]`.
  - `init()` is **idempotent** — sets up MobX `reaction` for persistence only once (guard with a `private initialized` flag). Loads persisted state from repository. Registered tabs are always rebuilt from the registry; persisted query/variables are restored. User tabs are restored from persisted state (without headers). If no persisted state, creates tabs from registry definitions only.
  - Persistence `reaction` saves on every relevant state change. Debounce saves to avoid excessive writes.
  - `executeQuery()` resolves the `PlaygroundClient` from the active tab's `definitionId`, calls `client.execute({ query, endpoint, variables, headers })`, stringifies the result with `JSON.stringify(result, null, 2)` and sets it as `response`.
  - `prettifyQuery()` uses `print(parse(query))` from the `graphql` package.
  - `copyQuery()` / `copyResponse()` use `navigator.clipboard.writeText()`.
  - `vm` getter returns the observable state directly (not a snapshot) so `observer` components get fine-grained reactivity.
  - Schema introspection: caches `IntrospectionQuery` result per endpoint. When a tab is selected and no cached schema exists for its endpoint, runs introspection via the tab's client. Stores the parsed result for the autocomplete hook to consume.

- [ ] **Step 5.3:** Create `feature.ts` using `createFeature`. Create `index.ts`.

---

## Task 6: UI components

**Files:**
- New: all files under `src/presentation/Playground/components/`
- New: all files under `src/presentation/Playground/hooks/`

- [ ] **Step 6.1:** Create `hooks/useResizableSplit.ts` — adapt from `app-sdk-playground/src/plugins/useResizableSplit.ts`. Vertical split with draggable divider. Returns `splitRef`, `editorPct`, `handleDividerMouseDown`.

- [ ] **Step 6.2:** Create `hooks/useMonacoGraphQL.ts` — Monaco setup for GraphQL:
  - `handleBeforeMount`: register GraphQL language if not already registered (syntax highlighting, bracket matching).
  - `handleEditorDidMount`: bind Cmd/Ctrl+Enter to execute callback via `editor.addAction()`.
  - Accepts the introspected schema from the presenter. When schema is available, registers a `CompletionItemProvider` using `getAutocompleteSuggestions()` from `graphql-language-service`. Updates the provider when the schema changes (tab switch).
  - Returns `editorRef`, `handleBeforeMount`, `handleEditorDidMount`.

- [ ] **Step 6.3:** Create `components/PlaygroundToolbar.tsx` — horizontal bar:
  - Left: title "GraphQL Playground" + shortcut hint (Cmd/Ctrl+Enter)
  - Right: Execute button (with `Loader` from `@webiny/admin-ui` when executing), Prettify button, Copy Query button, Copy Response button
  - Uses `Button` and `Loader` from `@webiny/admin-ui`.
  - Receives the full `presenter`.

- [ ] **Step 6.4:** Create `components/TabBar.tsx` — horizontal tab strip:
  - Renders each tab from `vm.tabs` with active state styling.
  - Registered tabs: no close button.
  - User tabs: close button (×).
  - Right-click on any tab opens `TabContextMenu` (duplicate, rename — rename only for user tabs).
  - "+" button at the end opens `EndpointSelector`.
  - Tab click calls `presenter.selectTab(id)`.
  - Close button calls `presenter.closeTab(id)`.
  - Shows the endpoint URL next to/below the tab name in a smaller font.

- [ ] **Step 6.5:** Create `components/TabContextMenu.tsx` — right-click context menu on tabs:
  - "Duplicate" — calls `presenter.duplicateTab(id)` (creates a user tab copy).
  - "Rename" — inline edit mode, calls `presenter.renameTab(id, name)` on confirm. Only for user tabs.

- [ ] **Step 6.6:** Create `components/EndpointSelector.tsx` — small dropdown/popover shown when clicking "+" in TabBar. Lists available endpoints from `vm.endpoints` (derived from tab definitions). Clicking one calls `presenter.createTab(definitionId)`.

- [ ] **Step 6.7:** Create `components/QueryEditor.tsx` — Monaco editor wrapper:
  - Language: `graphql`.
  - Controlled value from `vm.activeTab.query`.
  - `onChange` calls `presenter.updateQuery(value)`.
  - Uses hooks from `useMonacoGraphQL`.
  - Takes `editorPct` width from the resizable split.
  - Includes an editable endpoint field above the editor (text input showing `vm.activeTab.endpoint`, onChange calls `presenter.updateEndpoint(value)`).

- [ ] **Step 6.8:** Create `components/ResponseEditor.tsx` — read-only Monaco editor:
  - Language: `json`.
  - Value from `vm.activeTab.response`.
  - Read-only.
  - Shows placeholder text ("Run a query to see results") when no response yet.

- [ ] **Step 6.9:** Create `components/BottomPanel.tsx` — collapsible panel below the query editor:
  - Two sub-tabs: "Variables" and "Headers".
  - Each sub-tab contains a small Monaco editor (JSON mode).
  - Variables editor: value from `vm.activeTab.variables`, onChange calls `presenter.updateVariables()`.
  - Headers editor: value from `vm.activeTab.headers`, onChange calls `presenter.updateHeaders()`.
  - Collapse/expand toggle.
  - Active sub-tab tracked via `vm.activeTab.activeBottomPanel`.

- [ ] **Step 6.10:** Create `components/PlaygroundPage.tsx` — top-level layout component:
  - Injects `PlaygroundPresenter` via `useFeature`.
  - Calls `presenter.init()` on mount (idempotent).
  - Wraps with `observer` from `mobx-react-lite`.
  - Layout:
    ```
    ┌─────────────────────────────────────────┐
    │ PlaygroundToolbar                       │
    ├─────────────────────────────────────────┤
    │ TabBar                                  │
    ├───────────────────┬─────────────────────┤
    │ [endpoint field]  │ ResponseEditor      │
    │ QueryEditor       │                     │
    │                   │                     │
    ├───────────────────┤                     │
    │ BottomPanel       │                     │
    │ (vars/headers)    │                     │
    └───────────────────┴─────────────────────┘
    ```
  - Full height: `calc(100vh - 45px)` (same as SDK playground).
  - Resizable vertical split via `useResizableSplit`.
  - Each child component receives the full `presenter` (not split vm + actions).

---

## Task 7: Entry point + route wiring

**Files:**
- Modify: `src/index.tsx`
- Keep: `src/routes.ts`, `src/PermissionsSchema.ts`, `src/SecurityPermission.tsx`

- [ ] **Step 7.1:** Rewrite `src/index.tsx`:
  - Remove `createApolloClient` prop — no longer needed.
  - Remove `plugins.register(playgroundPlugins)` — no legacy plugins.
  - Keep `SecurityPermission`, menu registration, route registration.
  - Route element renders `PlaygroundPage` instead of old `Playground`.
  - Register DI features using `<RegisterFeature feature={...} />` for: tabRegistry feature, repository feature, presenter feature.
  - Export `GraphQLPlayground` component (no props) as a named export.

---

## Task 8: CMS tab registration via DI decorator

**Files:**
- Delete: `packages/app-headless-cms/src/admin/plugins/apiInformation/index.tsx`
- Move: `packages/app-headless-cms/src/admin/plugins/apiInformation/placeholder.*.graphql.ts` → `packages/app-headless-cms/src/admin/features/playgroundTabs/queries/`
- Modify: `packages/app-headless-cms/src/HeadlessCMS.tsx` — remove `apiInformation` import + `plugins.register()` call
- New: `packages/app-headless-cms/src/admin/features/playgroundTabs/CmsPlaygroundTabs.ts`
- New: `packages/app-headless-cms/src/admin/features/playgroundTabs/CmsPlaygroundClient.ts`
- New: `packages/app-headless-cms/src/admin/features/playgroundTabs/feature.ts`
- New: `packages/app-headless-cms/src/admin/features/playgroundTabs/index.ts`

- [ ] **Step 8.1:** Move placeholder query files from `admin/plugins/apiInformation/` to `admin/features/playgroundTabs/queries/`:
  - `placeholder.manage.graphql.ts`
  - `placeholder.read.graphql.ts`
  - `placeholder.preview.graphql.ts`

- [ ] **Step 8.2:** Create `CmsPlaygroundClient.ts` — raw-fetch `PlaygroundClient` implementation for CMS endpoints. Same pattern as the Main API client in Task 2, but with the CMS base URL. Auth token obtained the same way (token provider function).

- [ ] **Step 8.3:** Create `CmsPlaygroundTabs.ts` — decorates `PlaygroundTabRegistry` using `PlaygroundTabRegistry.createDecorator`. Wraps the original `getTabs()` and appends 3 CMS tabs:
  - `{ id: "cms-manage", name: "Headless CMS - Manage API", endpoint: "${apiUrl}/cms/manage", client: new CmsPlaygroundClient(...), defaultQuery: manageQuery }`
  - `{ id: "cms-read", name: "Headless CMS - Read API", endpoint: "${apiUrl}/cms/read", client: new CmsPlaygroundClient(...), defaultQuery: readQuery }`
  - `{ id: "cms-preview", name: "Headless CMS - Preview API", endpoint: "${apiUrl}/cms/preview", client: new CmsPlaygroundClient(...), defaultQuery: previewQuery }`

- [ ] **Step 8.4:** Create `feature.ts` using `createFeature` — registers the decorator.

- [ ] **Step 8.5:** Remove `apiInformation` import and `plugins.register(apiInformation)` from `HeadlessCMS.tsx`. Wire the new `playgroundTabs` feature into CMS admin module initialization via `<RegisterFeature>`.

---

## Task 9: Update consumers

**Files:**
- Modify: `packages/app-serverless-cms/src/Admin.tsx`

- [ ] **Step 9.1:** Update `Admin.tsx` — remove `createApolloClient` prop from `<GraphQLPlayground>`. The component now takes no props.

- [ ] **Step 9.2:** Remove any remaining imports of old types (`GraphQLPlaygroundTabPlugin`) from `app-headless-cms`.

---

## Task 10: Tests

**Files:**
- New: `packages/app-graphql-playground/__tests__/PlaygroundPresenter.test.ts`
- New: `packages/app-graphql-playground/__tests__/PlaygroundRepository.test.ts`

- [ ] **Step 10.1:** Create `PlaygroundPresenter.test.ts` — unit tests for:
  - `init()` with no persisted state → creates tabs from registry
  - `init()` with persisted state → restores user tabs, rebuilds registered tabs with persisted query/variables
  - `init()` is idempotent — calling twice doesn't duplicate reactions
  - `selectTab()` → changes activeTabId
  - `createTab()` → adds a user tab for the given definition
  - `closeTab()` on user tab → removes it
  - `closeTab()` on registered tab → no-op
  - `duplicateTab()` → creates a user tab copy
  - `renameTab()` on user tab → updates name
  - `updateQuery()` / `updateVariables()` / `updateHeaders()` / `updateEndpoint()` → updates active tab state
  - `executeQuery()` → calls client.execute with correct params, sets response
  - `executeQuery()` on network error → sets error response, no throw
  - `prettifyQuery()` → formats valid GraphQL, no-op on invalid
  - Persistence: mutations trigger repository.save() with correct shape (no headers)

- [ ] **Step 10.2:** Create `PlaygroundRepository.test.ts` — unit tests for:
  - `save()` + `load()` round-trip
  - `load()` with no stored data → returns null
  - `load()` with corrupt data → returns null (no throw)
  - Key scoping — different deployment IDs use different keys

---

## Task 11: Build + verify

- [ ] **Step 11.1:** Run the before-commit checklist:
  ```bash
  git add .
  yarn > /dev/null 2>&1
  node scripts/generateTsConfigsInPackages.js
  yarn adio
  yarn format > /dev/null 2>&1
  yarn lint
  yarn webiny sync-dependencies
  git add .
  ```

- [ ] **Step 11.2:** Build affected packages:
  ```bash
  yarn build -p @webiny/app-graphql-playground 2>&1 | tail -30
  yarn build -p @webiny/app-headless-cms 2>&1 | tail -30
  yarn build -p @webiny/app-serverless-cms 2>&1 | tail -30
  ```

- [ ] **Step 11.3:** Start the admin app and verify:
  - `/api-playground` route loads
  - Registered tabs appear (Main API + CMS tabs) and cannot be closed
  - User can create new tabs via "+" → endpoint selector
  - User-created tabs can be closed
  - Right-click → duplicate/rename works
  - Query execution works against Main API
  - Query execution works against CMS endpoints
  - Endpoint field is editable and changes where requests go
  - Variables editing works
  - Headers editing works (not persisted across refresh)
  - Query and variables persist across page refresh
  - Tab list/order persists across refresh
  - New registered tabs from freshly installed modules appear on next init
  - Resizable split works
  - Prettify button formats GraphQL
  - Copy Query / Copy Response buttons work
  - Cmd/Ctrl+Enter executes query
  - Monaco autocomplete suggests fields from introspected schema
  - Errors appear in the response editor as JSON (no toasts)
  - Bottom panel (variables/headers) collapses/expands
