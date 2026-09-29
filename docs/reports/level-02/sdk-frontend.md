# @webiny/sdk-frontend

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/sdk-frontend` is the framework-agnostic facade that a Next.js (or other frontend) integration wraps: `FrontendSdk` (exported as the `sdk` singleton) composes `@webiny/sdk`'s `Webiny` client with `@webiny/cms-sdk`'s and `@webiny/website-builder-sdk`'s `contentSdk` singletons behind `cms`/`wb` sub-facades, and `ComponentsSdk` adds GraphQL-based loading and runtime "hydration" of remote (dynamically-bundled) page-builder components. It correctly reuses `Result`/`HttpError`/`ApiError`/`NetworkError` from `@webiny/sdk` rather than reinventing error handling, and its `CmsSdk`/`WbSdk` wrappers are thin, consistent pass-throughs to the lower-level content SDKs. Overall health is otherwise concerning: the package has zero automated tests, and it has a high-severity security finding tracked privately (SEC-5).

## Public API
- `sdk` (singleton `FrontendSdk`, `src/FrontendSdk.ts:125`) and the `FrontendSdk` class — `init(config)` wires up `@webiny/sdk`'s `Webiny` client plus the `cms-sdk`/`website-builder-sdk` `contentSdk` singletons; exposes `.cms`, `.wb`, `.languages`, `.fileManager`, `.tenantManager`, `.tasks`, `.webhooks`, `.components`, and `isEditing`/`isServer`/`isClient`. This is the package's main entrypoint, re-exported wholesale by `packages/sdk-nextjs/src/index.ts:2` — its only in-monorepo consumer, since this is a public SDK layer meant for external Next.js/frontend consumer apps.
- `CmsSdk` (`src/CmsSdk.ts`) — wraps `cms-sdk`'s `contentSdk` (`getModel`/`getEntry`/`listEntries`) and `@webiny/sdk`'s `Webiny.cms` write operations (`createEntry`/`updateEntryRevision`/`deleteEntryRevision`/`publishEntryRevision`/`unpublishEntryRevision`), converting `null`/`undefined` results into `Result.fail`.
- `WbSdk` (`src/WbSdk.ts`) — wraps `website-builder-sdk`'s `contentSdk` (`getPage`/`listPages`/`getAllRedirects`/`getRedirectByPath`/`registerComponent`/`registerComponentGroup`/`isPreviewing`).
- `ComponentsSdk` (`src/ComponentsSdk.ts`) — `loadComponents()` (GraphQL fetch of published remote components) and `hydrateComponent()`/`scopeCss()` (turns a fetched bundle into a mounted, CSS-scoped React component). Consumed by `sdk-nextjs`'s `GraphQLRemoteComponentLoader.ts` (server-side, `mode: "server"`) and `ComponentSandbox.tsx` (browser preview, `mode: "browser"`).
- Re-exports: the package's `index.ts` also re-exports `Result`/`HttpError`/`ApiError`/`NetworkError`/`ValidationError`/`Language` from `@webiny/sdk`, and several types plus `resolveRefs`/`createComponent` from `@webiny/cms-sdk` and `createTheme`/`createComponent` from `@webiny/website-builder-sdk`, so downstream consumers only need to depend on this one package.

## Bugs
| # | Severity | Location (file path, no line) | Problem | Failure scenario | Confidence |
|---|----------|-------------------------------|---------|-------------------|------------|
| 1 | high | `packages/sdk-frontend/src/ComponentsSdk.ts` | Security finding — see private notes (SEC-5). | — | high |

## Duplication
None found — jscpd reports zero clones in this package, and it consistently delegates to `@webiny/sdk`/`@webiny/cms-sdk`/`@webiny/website-builder-sdk` rather than reimplementing their `Result`/error/content-fetching logic.

## Dead code
None found specific to this package. `WbSdk`'s methods and `ComponentsSdk`'s types have no direct in-monorepo consumers beyond `sdk-nextjs`'s wholesale re-export, but that is expected for a public SDK layer designed for external consumer apps rather than internal ones (the `cms-sdk`-level report separately notes that `resolveRefs`, re-exported here too, has no callers anywhere — that is a `cms-sdk` issue, not introduced by this package).

## Convention issues
None found. The package has no DI/feature wiring to check against the backend code-style rules (it's a plain frontend SDK), and its one non-trivial cast (`dependencies.React as typeof import("react")` in `ComponentsSdk.ts:180`) is a necessary consequence of `HydrateComponentDependencies.React` being intentionally typed as `unknown` to avoid a hard `react` dependency, not an avoidable cast.

## Test gaps
- The package has no `__tests__` directory and no test files at all.
- `ComponentsSdk.loadComponents`'s error-path branches (network failure, non-OK HTTP status, malformed JSON, GraphQL `errors`, missing envelope, `envelope.error`) are all untested despite being the majority of the method's logic.
- `ComponentsSdk.hydrateComponent`'s success and failure (`catch`) paths, and `scopeCss`'s CSS-selector rewriting (including the `:root` passthrough special case), have no coverage — notably, no test would have caught the missing SHA-256 verification (Bug #1) even if the hash comparison were added later without a regression test.
- `FrontendSdk.init`'s wiring (that `cms`/`wb`/`languages`/`fileManager`/etc. throw the expected "SDK is not initialized" error before `init()` is called, and are correctly wired after) is untested.

## Recommendations
1. Address security finding SEC-5 (see private security notes, `docs/.reports/security.md`).
2. Add unit tests for `ComponentsSdk.loadComponents`'s error branches and for `hydrateComponent`/`scopeCss`, since this is the most complex and most security-sensitive code in the package and currently has zero coverage.
3. Add a smoke test for `FrontendSdk.init`/uninitialized-access behavior, since it's the single entrypoint every consumer of this package goes through.
