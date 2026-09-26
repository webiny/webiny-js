# @webiny/app-graphql-playground

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/app-graphql-playground` is a full, MobX/DI-"feature"-powered in-browser GraphQL playground admin extension: multiple query tabs (registered and user-created), a Monaco-based query/response editor, a docs explorer, query history, and pluggable endpoint definitions gated behind the `dev-tools.graphql-playground.*` permission. It is extensible via `PlaygroundTabRegistry.createDecorator`, which `app-headless-cms` uses to add three extra endpoint tabs (CMS Manage/Read/Preview). Architecture and MobX-presenter test coverage are solid, but there is a confirmed high-severity security finding tracked privately (SEC-20).

## Public API

- `GraphQLPlayground` (`src/index.tsx`) — the registered extension component; consumed by `packages/app-serverless-cms/src/Admin.tsx` and re-exported from `packages/webiny/src/admin/graphql-playground.ts`.
- `PlaygroundTabRegistry`, `PlaygroundClientFactory`, `AuthenticatedPlaygroundClientFactory`, `PlaygroundClient` (`src/exports/admin/graphql-playground.ts`) — the extensibility surface. `PlaygroundTabRegistry` is decorated by `app-headless-cms`'s `CmsPlaygroundTabs` (`packages/app-headless-cms/src/admin/features/playgroundTabs/CmsPlaygroundTabs.ts`) to register three additional GraphQL endpoint tabs; that is currently the only external consumer found.
- Internal presenters (`PlaygroundPresenter`, `DocsExplorerPresenter`, `QueryHistoryPresenter`) and repositories (`PlaygroundRepository`, `QueryHistoryRepository`) follow the project's DI feature/abstraction pattern and are only consumed within the package's own component tree.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/features/playgroundClient/PlaygroundClient.ts` | Security finding SEC-20 — see private notes. | — | high |
| 2 | low | `src/presentation/Playground/PlaygroundPresenter.ts:302-319` | The `.catch()` branch of `executeQuery()`'s `definition.client.execute(request)` promise chain appears to be unreachable in production: the only shipped implementation of `PlaygroundClient.Interface` (`src/features/playgroundClient/PlaygroundClient.ts:43-64`) wraps both the `fetch()` call and the `response.json()` parse in one `try/catch` and always resolves — network errors and bad JSON responses are turned into a resolved `{ errors: [...] }` value rather than a rejection. | Any future implementation change that makes the client actually reject (e.g. a stricter client swapped in via DI) would newly exercise this path for the first time without a test ever having run it; today the branch is dead weight that gives a false impression of error-path coverage. | medium |

## Duplication

- In-package (from jscpd): the "click outside to close" listener in `src/presentation/Playground/components/EndpointSelector.tsx:20-36` duplicates the same 14-line pattern in `src/presentation/Playground/components/TabContextMenu.tsx:26-42`. `src/presentation/DocsExplorer/components/DocsTypeView.tsx` has two internal near-duplicate blocks (lines 53-60 vs 81-88, and 121-131 vs 141-151) for rendering a labeled list of `DocsTypeRef` items. `src/presentation/DocsExplorer/components/DocsExplorerDrawer.tsx:81-93` duplicates drawer-closing boilerplate also found in `src/presentation/QueryHistory/components/QueryHistoryDrawer.tsx:32-44`.
- Cross-package (confirmed by direct comparison): `src/presentation/Playground/hooks/useResizableSplit.ts` (53 lines) is a near line-for-line duplicate of `packages/app-sdk-playground/src/plugins/useResizableSplit.ts` (48 lines) — the same drag-to-resize split-pane hook was independently written twice for the two playground packages (only cosmetic differences: default split 50 vs 60, and where `MIN_PANE_PCT` is defined). This is exactly the kind of reusable UI utility that should live once in a shared package (e.g. `@webiny/admin-ui`) rather than being copied between playgrounds.
- Cross-package permission duplication: `src/PermissionsSchema.ts` declares both a `graphql-playground` entity and an `sdk-playground` entity under the shared `dev-tools` permission group, even though the `sdk-playground` entity is already independently declared by `@webiny/app-sdk-playground`'s own `src/PermissionsSchema.ts`. This is harmless at runtime because `app-admin`'s `mergeByName`/dedup-by-entity-id logic (`packages/app-admin/src/components/Permissions/mergeByName.ts`) collapses identical entity ids from multiple registrations, but it violates the documented convention (see `packages/app-admin/src/config/AdminConfig/SecurityPermissions.tsx:30-35`) that each contributing app should register only its own entities, and is an unnecessary second place to keep the `sdk-playground` entity definition in sync.

## Dead code

- See Bugs #2 above — the `executeQuery()` error branch is effectively unreachable given the current `PlaygroundClient` implementation.
- No unused exports were found; `codegraph`/grep confirms `PlaygroundTabRegistry`, `PlaygroundClientFactory`, and `AuthenticatedPlaygroundClientFactory` from the public `exports/admin/graphql-playground.ts` barrel are all consumed by `app-headless-cms`.

## Convention issues

- The DI "feature"/abstraction-per-file pattern (`abstractions/`, implementation file, `feature.ts`, `index.ts`) is followed consistently across `features/playgroundClient`, `features/queryHistory`, `features/repository`, and `features/tabRegistry`.
- The `PermissionsSchema.ts` duplication described above is the one real convention violation found: it should declare only the `graphql-playground` entity and leave `sdk-playground` to its owning package.

## Test gaps

- `PlaygroundPresenter`, `DocsExplorerPresenter`, `QueryHistoryPresenter`, `QueryHistoryRepository`, and `PlaygroundRepository` all have dedicated unit tests under `__tests__/`, with good coverage of tab lifecycle (create/close/duplicate/rename), persistence round-tripping, and history dedup.
- None of the credential/header-construction logic is tested: `PlaygroundClient.execute()`, `AuthenticatedPlaygroundClient.execute()`, `PlaygroundClientFactory`, and `AuthenticatedPlaygroundClientFactory` have zero test coverage, despite being the most security-sensitive code in the package (see Bugs #1).
- No component/UI tests exist for `TabBar`, `TabContextMenu`, `EndpointSelector`, the `DocsExplorer` component tree, `QueryEditor`, `ResponseEditor`, or `BottomPanel` — coverage stops at the presenter layer.

## Recommendations

1. Fix security finding SEC-20 (see private notes, `docs/.reports/security.md`).
2. Extract `useResizableSplit` (and ideally the repeated "click outside to close" listener) into one shared hook reused by both `app-graphql-playground` and `app-sdk-playground` instead of maintaining two near-identical copies.
3. Add unit tests for `PlaygroundClient`/`AuthenticatedPlaygroundClient` header-construction logic, and either make the client genuinely reject on failure or delete the now-dead `.catch` branch in `executeQuery()`.
