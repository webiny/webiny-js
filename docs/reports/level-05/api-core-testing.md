# @webiny/api-core-testing

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-core-testing` is a small, well-scoped test-utilities package: DI-based fakes for `@webiny/api-core`'s security abstractions (`TestAuthenticator`/`TestIdentity`, `TestAuthorizer`/`TestPermissions`), two `@webiny/event-handler-core` test-handler decorators that seed identity and a "root" tenant before a test request runs (`AuthTriggerHandler`, `RootTenantInitializer`), a `createIdentity` builder, and a handful of shared test constants (`tenancySecurity.ts`). It has no storage-operations, tenant-scoping, or pagination logic of its own (it depends on `api-core` and `event-handler-core` only), so criteria 2 and 3 in this audit (tenant scoping in queries, cursor/pagination handling) are N/A for this package. Health is good — small, focused, no bugs found — and it is genuinely widely used: `TestAuthorizer`/`TestAuthenticator` have roughly 26 consumers across `api-*` test suites (codegraph), making this the de-facto standard test-security harness for the backend.

## Public API
- `TestAuthenticator`/`TestIdentity` (`src/mocks/TestAuthenticator.ts:10,20`) and `TestAuthorizer`/`TestPermissions` (`src/mocks/TestAuthorizer.ts:17,40`) — DI implementations of `api-core`'s `Authenticator`/`Authorizer` abstractions. Codegraph shows ~26 callers, e.g. `api-headless-cms-testing`, `api-aco`, `api-file-manager`, `api-file-manager-aco`, `api-headless-cms-aco` test-handler setups.
- `AuthTriggerHandler`/`RootTenantInitializer` (`src/handlers/*.ts`) — `TestHttpEventHandler` decorators that authenticate the `authorization` header / seed a hardcoded "root" tenant before dispatch, mirroring the production identity/tenant loaders for tests.
- `createIdentity` (`src/identity.ts:11`) — builds an `AuthenticatedIdentity` test double with sensible defaults.
- Note: `api-core`'s own test suite still carries an independent, near-duplicate `TestAuthorizer` (`packages/api-core/__tests__/mocks/TestAuthorizer.ts:13`, used only by `packages/api-core/__tests__/useGqlHandler.ts`) rather than using this package's shared implementation — a missed reuse opportunity worth flagging even though it lives in `api-core`, not here.

## Bugs
None found.

## Duplication
No clones reported within this package (jscpd: 0 duplicates). See the cross-package note above (`api-core`'s own `TestAuthorizer` duplicating this package's).

## Dead code
None found — every export (`TestIdentity`, `TestAuthenticator`, `TestPermissions`, `TestAuthorizer`, `TestPermissionsHolder`, `AuthTriggerHandler`, `RootTenantInitializer`, `createIdentity`, `defaultIdentity`, `FULL_ACCESS_ROLE_ID`, `FULL_ACCESS_TEAM_ID`, `UNKNOWN_TEAM_ID`) is re-exported from `src/index.ts` and codegraph confirms live consumers for the security mocks; the handler decorators and identity/tenancy constants are the standard scaffolding used by every downstream `*-testing` package's handler setup.

## Convention issues
None found. DI naming is consistent (`TestAuthenticatorImpl`/`TestAuthorizerImpl` implementation classes named after their abstraction, `TestIdentity`/`TestPermissions` as separate `Abstraction` tokens), and the barrel export in `src/index.ts` only re-exports the package's actual public surface.

## Test gaps
The package itself has no `__tests__` directory — it is pure test infrastructure consumed by other packages' test suites, so there is nothing to test in isolation here; its correctness is exercised indirectly by every downstream package that uses it. One n/a-adjacent observation: `TestAuthorizerImpl.authorize()` (`src/mocks/TestAuthorizer.ts:25-37`) has an api-key-identity branch that only special-cases `identity.type === "api-key"` with embedded `permissions`; there is no test in this package asserting that fallback path behaves correctly, though this is a minor gap given the package's small surface.

## Recommendations
1. Point `api-core`'s own `__tests__/useGqlHandler.ts` at this package's `TestAuthorizer` instead of its private duplicate, to remove the divergence risk between the two.
2. No storage/security-critical code lives here, so no further action is required for this audit's tenant-scoping/pagination criteria (both N/A).
3. Consider a minimal smoke test for `AuthTriggerHandler`/`RootTenantInitializer` (e.g. asserting `identityCtx.setIdentity`/`tenantCtx.setTenant` are called with the expected shape) since they are load-bearing scaffolding for dozens of downstream test suites.
