# @webiny/api-core — Security

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This slice covers `packages/api-core/src/features/security` (~5.6k lines): identity/authentication (`IdentityContext`, `AuthenticationContext`, JWT/OIDC identity providers), authorization (`AuthorizationContext`, the `Authorizer` chain, `GroupsTeamsAuthorizer`), API keys, roles, teams, and permission utilities. The design is generally solid and consistently tenant-scoped at the repository layer (every `RolesRepository`/`TeamsRepository`/`ApiKeysRepository` method reads `tenantContext.getTenant()` and threads it into the storage-operations call), and the per-request DI container lifecycle (confirmed via `ApiCoreFeature.register` being called on the per-request child container, per its own comment) rules out the cross-tenant cache-bleed that the `RolesRepositoryCachingDecorator`/`TeamsRepositoryCachingDecorator`'s tenant-blind, in-memory `ListCache` would otherwise create. Two security findings (SEC-17, SEC-18) are tracked in the private security notes.

## Public API
This slice's main exports (all consumed from `packages/api-core/src/features/security/*`, wired together in `SecurityFeature.ts`):
- `IdentityContext` (identity + permission resolution: `getIdentity`, `setIdentity`, `withIdentity`, `getPermission`/`getPermissions`/`listPermissions`/`hasFullAccess`, `withoutAuthorization`) — the primary abstraction every use case in this slice, and every `api-*` package's resolvers/use cases, calls to check permissions.
- `AuthorizationContext` / `Authorizer` chain (`ApiKeyAuthorizer`, `RolesTeamsAuthorizer`) — pluggable authorization strategies tried in sequence; other packages can register additional `Authorizer` implementations.
- `Authenticator` chain (`ApiKeyAuthenticator`, plus the OIDC/JWT identity providers in `~/idp`) — resolves a request's `IdentityData` from a bearer token.
- API key / role / team CRUD use cases (`CreateApiKeyUseCase`, `GetApiKeyByTokenUseCase`, `CreateRoleUseCase`, `CreateTeamUseCase`, etc.) — consumed by this package's own GraphQL schema factories (`SecuritySchemaFactory`, not in this slice) and, transitively, by every downstream `api-*` package that needs `IdentityContext`/permission checks (dozens of packages, e.g. `api-headless-cms`, `api-file-manager`, `api-aco`, `webhooks`).
- `AppPermissions` / `getPermissionsFromRoles` / `filterOutCustomWbyAppsPermissions` / `IdentityValue` — small permission-shaping utilities used both inside this slice and by several `api-*` packages building per-app permission gates (e.g. Page Builder/Form Builder-style `rwd`/`own` checks).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/api-core/src/features/security/apiKeys/` | Security finding SEC-17 — see private notes. | — | high |
| 2 | high | `packages/api-core/src/features/security/authorization/AuthorizationContext/`, `packages/api-core/src/features/security/IdentityContext/` | Security finding SEC-18 — see private notes. | — | medium |

## Duplication
19 of the package's 41 jscpd clone pairs touch this slice, all small (8-20 lines) structural duplication rather than logic bugs:
- `RolesRepositoryCachingDecorator.ts:25-40` / `TeamsRepositoryCachingDecorator.ts:25-40` — the `get()` cache-hit/cache-miss/populate-on-success shape is identical between roles and teams; a shared generic `CachingRepositoryDecorator<T>` base could remove this.
- `roles/shared/errors.ts:19-38` / `teams/shared/errors.ts:19-38` — parallel error-class definitions (not-found/persistence/validation) with the same shape for roles vs. teams.
- Several pairs across `Get*UseCase.ts`/`List*UseCase.ts`/`Delete*UseCase.ts`/`Update*UseCase.ts` for roles vs. teams vs. api-keys (e.g. `GetRoleUseCase.ts:9-18` / `ListRolesUseCase.ts:9-18`, `DeleteRoleUseCase.ts:10-25` / `UpdateRoleUseCase.ts:16-31`, `DeleteApiKeyUseCase.ts:9-24` / `UpdateApiKeyUseCase.ts:12-28`) — these three CRUD families (roles, teams, api keys) are essentially the same use-case template copy-pasted three times. Given how consistently this pattern repeats, a shared "permission-gated repository CRUD use case" helper would cut a meaningful fraction of this slice's size and reduce the risk of a fix (e.g. the permission-escalation issue above) being applied to only one of the three copies.
- `apiKeys/shared/ApiKeysRepository.ts:50-65` / `:80-95` — `getByToken`/`getBySlug`'s storage-then-factory-fallback logic is duplicated inline; could be extracted into one private helper parameterized by lookup function.
- `permissions/createPermissions.ts` has several internal near-duplicate blocks (lines ~50-229) — not reviewed in depth for this slice beyond noting the clones exist.
- `apiKeys/shared/schemas.ts:9-16` / `:20-27` — `createApiKeyInputSchema`/`updateApiKeyInputSchema` share the same `permissions`/`description` field definitions verbatim; a shared base schema (`.extend()`) would remove the duplication. Related: security finding SEC-17 — see private notes.

## Dead code
No dead exports found within the reviewed scope.

## Convention issues
No significant AGENTS.md convention violations found. The slice consistently follows the one-abstraction-per-file / DI-naming pattern (`abstractions.ts` + implementation file named after the exported symbol, e.g. `ApiKeyAuthenticator.ts` exporting `ApiKeyAuthenticator`), and barrel `index.ts` files in this slice export only what's needed by `SecurityFeature.ts` and downstream consumers.

## Test gaps
- No test in `__tests__/security/apiKeys.*.test.ts` covers a caller whose own resolved permissions are narrower than the `permissions` array supplied when creating/updating an API key (directly relevant to Bug #1).
- Security findings SEC-17 and SEC-18 have no regression tests (see private notes).
- `RolesTeamsAuthorizer`'s parent-tenant permission fallback (sub-tenant identity inheriting the parent tenant's role permissions) has no dedicated unit test in this slice; it's a deliberately-scoped, documented behavior (see its own inline comment) but is exactly the kind of tenant-boundary logic worth a direct test rather than only incidental coverage via higher-level GraphQL tests.
- `ApiKeyAuthenticator`/`ApiKeyAuthorizer`/`GetApiKeyByTokenUseCase` show "no tests found within 3 caller hops" per codegraph's blast-radius check, even though `apiKeys.graphql.test.ts`/`apiKeys.features.test.ts` do exercise API-key creation and lookup end-to-end — worth double-checking that authentication-time behavior (a malformed/revoked/wrong-tenant token) is actually covered by those end-to-end tests rather than assumed.

## Recommendations
1. Fix security finding SEC-17 (see private notes).
2. Fix security finding SEC-18 (see private notes).
3. Extract the repeated roles/teams/api-keys CRUD use-case template (see Duplication) into a shared helper — beyond the token savings, it would make the Bug #1-style fix apply uniformly across all three instead of needing three separate patches.
