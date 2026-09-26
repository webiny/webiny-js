# @webiny/app-sdk-playground

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/app-sdk-playground` is a small in-browser admin devtool extension, gated behind the `dev-tools.sdk-playground.*` permission, that lets an authenticated admin write and run arbitrary TypeScript/JavaScript against the `@webiny/sdk` `Webiny` facade directly in the browser (Monaco editor with ambient SDK type declarations, plus a captured-console output panel). Unlike its sibling `@webiny/app-graphql-playground` — which wraps equivalent client/credential logic in the project's DI "feature"/abstraction pattern — this package is implemented as plain React hooks with no DI layer, is much smaller, and has zero automated tests. Credential handling is straightforward and endpoint is fixed (not user-editable), so it does not share the credential-exfiltration risk found in the GraphQL playground.

## Public API

- `SdkPlayground` (`src/index.tsx`) — the registered extension component; the only consumer found is `packages/app-serverless-cms/src/Admin.tsx`. No other export is used outside the package.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `src/plugins/Playground.tsx:12-16`, `src/plugins/useMonacoEditor.ts:31-57` | The Ctrl/Cmd+Enter keybinding registered via `ed.addAction` inside `handleEditorDidMount` (invoked once, at Monaco mount) closes over the `handleRun` argument passed into `useMonacoEditor`, which is the inline arrow `() => handleRun()` created fresh on every `Playground` render. Because that closure is only captured once at mount time, and `useCodeExecution`'s `handleRun` is a `useCallback` depending on `tenant`/`authenticationContext`/`showSnackbar`, the keybinding always invokes the version of `handleRun` bound at first mount. The code text itself is safe (fetched live via `editorRef.current.getValue()`), but `tenant`/`authenticationContext` values are the ones captured at mount. The toolbar's "Run Code" button is unaffected, since `PlaygroundToolbar` receives the current `handleRun` directly as a prop on every render. | If the active tenant or auth context changes while the SDK Playground stays mounted (e.g. a tenant switch without a full remount), pressing Ctrl+Enter could execute against/authenticate as the tenant that was active when the editor first mounted rather than the currently selected one, while the visible "Run Code" button would use the correct, current tenant. | medium |

## Duplication

- Within the package: jscpd reports zero clones.
- Cross-package (confirmed by direct comparison): `src/plugins/useResizableSplit.ts` (48 lines) is a near line-for-line duplicate of `packages/app-graphql-playground/src/presentation/Playground/hooks/useResizableSplit.ts` (53 lines) — the same drag-to-resize split-pane hook was written independently for both playground packages, differing only in the default split percentage (60 vs 50) and where the `MIN_PANE_PCT` constant lives. This should be consolidated into one shared hook (see the matching note in the `app-graphql-playground` report).
- No other duplication of dependency-level utilities (per the level-0 `@webiny/sdk`/`@webiny/feature`/`@webiny/icons` summaries) was found; `consoleCapture.ts`'s `formatValue`/`createCustomConsole` is bespoke to this package's output panel and doesn't reimplement anything documented in those summaries.

## Dead code

None found — `SecurityPermission`, `PermissionsSchema`, `routes.ts`, and every file under `src/plugins/` are reachable from `src/index.tsx`.

## Convention issues

- This package uses no DI "feature"/abstraction layer at all, unlike its sibling `app-graphql-playground`, which wraps equivalent client/credential logic behind `createAbstraction`/`createFeature`. That is a defensible simplification for a package this size, but it also means this package has no equivalent of `PlaygroundTabRegistry` — its target API endpoint is hard-coded to `WEBINY_ADMIN_API_URL`/`API_URL` (`src/plugins/useCodeExecution.ts:23`) with no extensibility point for other packages to add additional SDK targets.
- `src/plugins/declarations/*.ts` (`cms.ts`, `common.ts`, `fileManager.ts`, `languages.ts`, `tasks.ts`, `tenantManager.ts`) hand-author ambient `.d.ts`-as-string content that must be kept in sync with `@webiny/sdk`'s real types by hand; the package's own comment in `sdkGlobalDeclaration.ts:4` already flags this as a "should be auto-generated in the future" TODO. Not a bug today, but a maintenance risk if `@webiny/sdk`'s public API changes without a matching manual update here.

## Test gaps

The package has no `__tests__` directory and zero automated tests. In particular, none of the following is covered: `useCodeExecution`'s `new Function`-based code-execution path, `consoleCapture`'s message formatting/dedup logic, or the permission-gated menu/route wiring in `index.tsx`.

## Recommendations

1. Add tests for `useCodeExecution` and `consoleCapture` — the two pieces of actual runtime logic in the package — since neither has any coverage today.
2. Consolidate `useResizableSplit` with the identical hook in `app-graphql-playground` into one shared implementation instead of maintaining two copies.
3. Either fix or explicitly accept-and-document the stale-closure risk in the Ctrl+Enter keybinding described in Bugs #1; low priority since the toolbar's "Run Code" button path is unaffected.
