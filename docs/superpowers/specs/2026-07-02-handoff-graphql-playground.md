# Session Handoff — 2026-07-02 — Custom GraphQL Playground

## What was done

- Designed and implemented a custom GraphQL Playground replacing the old CDN-loaded `graphql-playground-react` external dependency
- Full grill-me design session covering 15 architectural decisions (editor, client, tabs, persistence, schema, layout, errors, styling, permissions, etc.)
- Fable 5 review of the plan identified 7 Critical and 7 Important issues — all resolved before implementation
- 15 commits, 52 files changed (+3645/-376 lines), 37 unit tests
- Two rounds of full-branch code review with fixes

### Package changes

- `packages/app-graphql-playground` — complete rewrite: deleted old CDN-based playground, created DI-wired implementation with Monaco Editor, MobX presenter, raw-fetch GraphQL clients, localStorage persistence
- `packages/app-headless-cms` — CMS tabs now registered via DI decorator instead of legacy plugin system; old `apiInformation` plugin deleted
- `packages/app-serverless-cms` — removed `createApolloClient` prop from `<GraphQLPlayground>`

### Architecture (3-layer pattern)

- **Features layer:** `PlaygroundClient` (raw fetch per tab), `PlaygroundTabRegistry` (DI + decorator), `PlaygroundRepository` (localStorage via existing `LocalStorage` abstraction)
- **Presentation layer:** `PlaygroundPresenter` (MobX state — tabs, execution, introspection, persistence), 10 React components + 2 hooks
- **CMS integration:** `CmsPlaygroundTabsDecorator` adds 3 CMS tabs (Manage/Read/Preview) via `PlaygroundTabRegistry.createDecorator`

## Key decisions

- Each tab provider brings its own `PlaygroundClient` (raw `fetch`, owns auth/tenant headers) — playground is completely generic
- No permissions — if you can access admin, you can use the playground (intentional regression from old per-endpoint permission checks)
- Registered tabs (from DI) are permanent and cannot be closed; user-created tabs are closable
- Headers not persisted to localStorage (security)
- `graphql-language-service` for Monaco autocomplete (not `monaco-graphql` — incompatible with CDN-loaded Monaco)
- Endpoint field is editable per tab — user can override where requests go
- Schema introspection debounced (1s) when endpoint is edited

## Current state

- Branch: `bruno/feat/own/app-graphql-playground`
- Tests: 37 passed (31 presenter + 6 repository)
- Build: all 3 affected packages build clean
- Lint/format: passing
- Unpushed commits: 15

## What might come next

- **Manual testing:** Start the admin app and verify the playground at `/api-playground` — UI has not been tested in a browser yet
- **Docs explorer (v2):** Schema-aware sidebar for browsing types/fields/arguments
- **Query history:** Per-tab or global history of executed queries
- **Dark theme:** Monaco theme matching admin dark mode
- **Known minor issues from review:** deprecated `navigator.platform`, module-level `languageRegistered` flag, unused `editorRef` return from `useMonacoGraphQL`
