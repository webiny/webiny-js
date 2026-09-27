# @webiny/sdk-nextjs

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/sdk-nextjs` is the top-level Next.js integration package that application code imports: it re-exports the entire surface of `@webiny/sdk-frontend`, `@webiny/cms-nextjs` and `@webiny/website-builder-nextjs` behind one entry point, and adds its own three pieces of Next.js/browser-specific logic — a "remote components" server-side loader (`RemoteComponentLoader`/`GraphQLRemoteComponentLoader`, with SHA-256 artifact verification for the URL-based path), a `webpack.ts` re-export of `injectThemeCss`, and a client-side `ComponentSandbox` used for live component-preview iframes. The re-export surface is a thin, correct pass-through (matches the pattern already noted as healthy in `cms-nextjs`/`sdk-frontend`/`website-builder-nextjs`'s own reports). The package's own new code is where the problems are: `ComponentSandbox` has a confirmed critical security issue (see Bugs), and the whole "remote components" feature area outside the well-tested `RemoteComponentLoader` class has zero test coverage.

## Public API
- Full re-export of `@webiny/sdk-frontend`, `@webiny/cms-nextjs`, and `@webiny/website-builder-nextjs` (`src/index.ts`) — this is the package downstream Webiny sites import as `@webiny/sdk-nextjs`.
- `RemoteComponentLoader` (`src/remoteComponents/RemoteComponentLoader.ts`) — server-side loader that fetches a JSON manifest, verifies each component bundle's SHA-256 against the manifest before dynamically `import()`-ing it, and caches by URL/hash. Well tested (7 cases in `__tests__/RemoteComponentLoader.test.ts`); no in-repo consumers besides its own test (it is a library export for downstream apps).
- `GraphQLRemoteComponentLoader` (`src/remoteComponents/GraphQLRemoteComponentLoader.ts`) — server-side loader that fetches components via `@webiny/sdk-frontend`'s `ComponentsSdk.loadComponents` GraphQL call and hydrates them; no tests.
- `ComponentSandbox` (`src/ComponentSandbox.tsx`) — client component exported from the package root, used by the website builder's component preview/editor flow. No tests. Has a confirmed critical security issue — see Bugs.
- `injectThemeCss` (`src/webpack.ts`) — re-export of `website-builder-nextjs`'s webpack helper, no added logic.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `src/ComponentSandbox.tsx` | Security finding SEC-19 — see private notes. | — | high |
| 2 | low | `src/remoteComponents/GraphQLRemoteComponentLoader.ts` | Security finding SEC-5 — see private notes. | — | low |

## Duplication
No jscpd-detected clones within the package. The re-export files (`index.ts`, `webpack.ts`) are pure pass-throughs with no reimplementation.

## Dead code
None found with high confidence. Every exported symbol is either re-exported from a dependency (external consumers may use it) or used internally (`createServerSdk`/`RemoteComponentCache` by `RemoteComponentLoader`). Because this package's entire purpose is to be a public SDK surface for downstream Next.js apps outside this monorepo, in-repo caller counts are not a reliable dead-code signal here and were not used as one beyond the barrel case already covered for other packages.

## Convention issues
None of note — the package has no DI code, and file-per-concern is followed (`RemoteComponentLoader`, `GraphQLRemoteComponentLoader`, `RemoteComponentCache`, `verifyArtifact`, `createServerSdk`, `errors` are each in their own file).

## Test gaps
- `ComponentSandbox.tsx` has zero tests — notably, the file with the critical bug above.
- `GraphQLRemoteComponentLoader.ts` has zero tests (contrast with `RemoteComponentLoader.ts`'s 7-case suite).
- `createServerSdk.ts` and `webpack.ts` have zero tests (both are small, but `createServerSdk`'s environment defaults feed directly into every hydrated remote component).

## Recommendations
1. Fix the critical issue in `ComponentSandbox.tsx` (see `docs/.reports/security.md`) before this code path is exercised in production.
2. Fix security finding SEC-5 (see private notes).
3. Add test coverage for `ComponentSandbox` and `GraphQLRemoteComponentLoader`, including regression coverage for the fix once #1 is addressed.
