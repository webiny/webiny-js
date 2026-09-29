# @webiny/api-headless-cms-testing

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-headless-cms-testing` is a small (3 source files), well-scoped integration-test harness: `createCmsTestHandler` wires a real request pipeline the same way the production AWS handler does (`ApiCoreFeature` + storage operations + `HeadlessCmsFeature` + `GraphQLEngineFeature`), seeded with a test WCP license, a fixed "root" tenant, and `@webiny/api-core-testing`'s fake authenticator/authorizer, then returns `invoke`/`invokeCms`/`getContext`/`createQuery`/`createMutation`/`introspect` helpers for consuming packages' own test suites to build on. It has no storage-operations, where-filter/sort translation, tenant-scoping-in-queries, or index-naming logic of its own — those are exercised by the real feature code it wires together, not implemented here — so most of this audit's usual "where/sort/tenant/index" focus areas are not applicable to this package. Health is good: the code is small, the DI wiring mirrors the real app closely (reducing test/production drift), and it is heavily adopted (`createCmsTestHandler` has ~26 callers across other packages' test suites, e.g. `api-aco`, `api-audit-logs`, `api-headless-cms-bulk-actions`, `api-headless-cms-es-tasks`). The one real gap is that the package itself has zero automated tests of its own harness logic.

## Public API

- `createCmsTestHandler` (`src/createCmsTestHandler.ts:70`) — the sole substantive export; builds and returns the test handler + convenience wrappers. Codegraph: ~26 callers across the monorepo's `api-*` test suites (e.g. `packages/api-aco/__tests__/utils/useGraphQlHandler.ts`, `packages/api-audit-logs/__tests__/helpers/useHandler.ts`, `packages/api-headless-cms-bulk-actions/__tests__/context/useGraphQLHandler.ts`, `packages/api-headless-cms-es-tasks/__tests__/context/useHandler.ts`), making it the de-facto standard CMS integration-test harness, analogous in role to `api-core-testing`'s `TestAuthenticator`/`TestAuthorizer` (which this package re-exports and builds on).
- `processLegacyPlugins` (`src/processLegacyPlugins.ts:15`) — applies legacy `RegisterExtensionPlugin`-shaped objects (detected by a `plugin.type` string check rather than `instanceof`, deliberately, per its doc comment, to survive duplicate-module-instance situations) against a DI container at register time; used internally by `createCmsTestHandler` and re-exported for consuming packages that need to apply their own storage-operations presets the same way.
- `TestIdentity`/`TestAuthenticator`, `TestPermissions`/`TestAuthorizer`, `AuthTriggerHandler`, `RootTenantInitializer` (`src/index.ts:4-7`) — pure re-exports of `@webiny/api-core-testing`'s abstractions; this package adds no behavior on top, it just bundles them alongside the CMS-specific handler for convenience.

## Bugs

None found. `createCmsTestHandler`'s `legacyPlugins` dispatch (function vs. plugin-object detection via `typeof p === "function" && !p.prototype`, `createCmsTestHandler.ts:107`) is a deliberately narrow heuristic documented in the surrounding comments and scoped to this package's own legacy-plugin bridging; no concrete failure scenario was found for it within this package's code.

## Duplication

None found — jscpd reports no clones in this package (3 small source files, no internal repetition), and the package correctly delegates to `@webiny/api-core-testing`/`@webiny/event-handler-core`'s testing feature rather than reimplementing test-request plumbing.

## Dead code

None found — both exported functions (`createCmsTestHandler`, `processLegacyPlugins`) have confirmed external consumers (codegraph: 26 callers for `createCmsTestHandler`; `processLegacyPlugins` is used internally by `createCmsTestHandler` and re-exported for consumer packages' own storage-preset wiring).

## Convention issues

None of significance — small, single-purpose files, consistent with AGENTS.md's "one abstraction per file" for a package this size.

## Test gaps

The package has no `__tests__/` directory of its own (confirmed via `find`), so `createCmsTestHandler`'s own wiring logic — the `legacyPlugins` function/object dispatch order (register-time objects → `setup` → post-`setup` functions), the `getContext`/`GraphQLContextualSchema` capture trick, and `processLegacyPlugins`'s duck-typed plugin detection — is only ever exercised indirectly, through the ~26 consumer packages' own test suites, rather than by a dedicated test that would catch a regression in the harness itself before it silently breaks every consumer's tests.

## Recommendations

1. Add a minimal self-test for `createCmsTestHandler` (e.g. a smoke test in this package's own `__tests__/` asserting `invoke`/`invokeCms`/`getContext` work against a trivial CMS model) so a regression in the shared harness is caught here rather than surfacing as failures across ~26 dependent packages' test suites.
2. Add a focused test for `processLegacyPlugins`'s `plugin.type === REGISTER_EXTENSION_TYPE` detection, given the doc comment explicitly calls out a subtle cross-module-instance edge case (`instanceof` would miss a plugin from a duplicated `@webiny/handler` module instance) that is exactly the kind of thing regression-prone without a test.
3. No functional issues found beyond the above; this package is low-risk and low-priority relative to the other two packages in this batch.
