# @webiny/api-core — Core services

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

This slice covers everything in `packages/api-core/src` except `features/security`: the composition root (`ApiCoreFeature`), the public barrel exports (`exports/`), the small utility features (build params, date/string formatting, slugify, masking, hashing, encryption, feature flags, logging, key-value store, event publisher, service discovery, request-context loaders, webhooks abstractions, tasks abstractions), the larger AI, WCP-licensing, tenancy, admin-users and system-install features, the domain-layer GraphQL schema factories, the Zod-based model builder, and the JWT/OIDC identity-provider (`idp/`). The package is generally well factored — a consistent use-case/repository/gateway split per feature, decorators used correctly for cross-cutting concerns (WCP seat/tenant counting, license-gated feature flags), and events published around every mutation. A couple of findings involving the tenancy and AI file-processing code are security-sensitive and are detailed only in the private security notes (see Bugs). Separately, the OIDC `JwksCache` never expires or is refreshed, so a JWKS key rotation on the identity provider's side is only picked up after a process/container restart. Other packages should reuse this slice's `Hasher` (salted, self-describing scrypt hashing — never roll your own password hashing), `Encryption` (AES-256-GCM via `BuildParams`-provided passphrase), `Slugify`/`StringFormatter`, `DateFormatter`, and `GlobalKeyValueStore`/`KeyValueStore` rather than reimplementing any of them.

## Public API

- `Hasher`, `Encryption`, `Logger`, `BuildParam`/`BuildParams`, `DomainEvent`/`EventPublisher`, `GlobalKeyValueStore`/`KeyValueStore`, `Ai`/`AiSdk*`, `TextExtractor` (`exports/api.ts`, `features/*/index.ts`) — the general-purpose, non-tenancy-specific services. Consumed across most `api-*` packages (e.g. `api-headless-cms`, `api-file-manager`, `ai-powerups`, `i18n`, `lexical-nodes` use `TextExtractor`/`Ai`; `Hasher`/`Encryption` back API-key and credential storage in the security feature, out of this slice).
- Tenancy use cases: `CreateTenantUseCase`, `UpdateTenantUseCase`, `DeleteTenantUseCase`, `GetTenantByIdUseCase`, `ListTenantsUseCase`, `InstallTenantUseCase`, `TenantContext` (`exports/api/tenancy.ts`) — the tenant CRUD/installation surface used by the GraphQL layer (`graphql/` in this package) and by every other package's `AppInstaller` implementations that plug into `InstallTenantUseCase`'s dependency-ordered installer pipeline.
- Admin-user use cases: `CreateUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`, `GetUserUseCase`, `ListUsersUseCase`, `ListUserTeamsUseCase` (`exports/api/security/user.ts`) — backs `graphql/users/UsersSchemaFactory.ts` and is consumed by the admin app's user-management UI over GraphQL.
- `TaskService`, `TaskDefinition`, `TaskHandler`, `TaskController` (`exports/api/tasks.ts`) — pure abstractions (no implementation in this package); the concrete task runner lives in `@webiny/tasks` and is consumed by ~10+ packages that register long-running background tasks (module-augmented `ITaskController`).
- `WcpLicenseProvider`, `WcpContext` (`features/wcp/`) — the license/feature-gate surface. `WcpContext` is decorated by `WcpContextWithFeatureFlagsDecorator` and consumed wherever a package needs `canUseXxx()` checks (AACL, teams, AI powerups, etc.).
- `IdentityProvider`/`OidcIdentityProvider`/`JwtIdentityProvider` (`idp/index.ts`) — the pluggable JWT verification seam; `JwtAuthenticator` (registered against the security feature's `Authenticator` abstraction, out of this slice) iterates registered providers to authenticate a bearer token.
- GraphQL: `ApiCoreSchemaFactory` (base scalars/`Error`/`BooleanResponse`), `SecuritySchemaFactory`, `UsersSchemaFactory`, `SystemSchemaFactory`, `WcpSchemaFactory`, `FeatureFlagsSchemaFactory`, and `NotAuthorizedResponse` — registered directly in `ApiCoreFeature.register` against `@webiny/api-graphql`'s `CoreGraphQLSchemaFactory`.
- `BaseModel`/`ModelBuilder`/`createModelSchema` (`models/base/`) — a small Zod-schema-driven model base class with `validate`/`clone`/`updateWith`; used by the CMS-model and simple-page model builders in `models/cms`/`models/simple` (used by `@webiny/api-page-builder`-adjacent packages, per file naming).

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-core/src/features/tenancy` | Security finding SEC-14 — see private notes. | — | high |
| 2 | medium | `packages/api-core/src/idp/JwksCache.ts` | `JwksCache` caches fetched JWKS keys per issuer in a plain `Map` with no TTL and no automatic invalidation; `clearCache()` exists but is never called anywhere in the monorepo (confirmed via codegraph — 0 callers besides its own internal `Map.clear`). The cache is registered as a container singleton instance in `idp/feature.ts`, so it lives for the whole process/Lambda-container lifetime. | If the external OIDC provider rotates its signing keys (a routine operational event), tokens signed with the new key present a `kid` that isn't in the stale cached key set. `OidcJwtIdentityProvider.verifyToken` (`packages/api-core/src/idp/OidcJwtIdentityProvider.ts`) does `jwks.find(key => key.kid === header.kid)`, gets `undefined`, and returns `null` — the request is treated as unauthenticated — until the process/container is recycled and re-fetches JWKS. | high |
| 3 | medium | `packages/api-core/src/features/ai/TextExtractor/parsers/docxParser.ts` | Security finding SEC-15 — see private notes. | — | medium |

## Duplication

- `packages/api-core/src/graphql/security/addRoleSchema.ts:71-154` and `packages/api-core/src/graphql/security/addTeamSchema.ts:91-174` share ~5 blocks of 12-16 lines each (per jscpd): both files repeat the identical `try { const result = await useCase.execute(...); if (result.isFail()) throw result.error; return new Response(...); } catch (e) { return new ErrorResponse(e); }` resolver boilerplate for their respective create/update/delete/get/list resolvers. Worth extracting a small `resolveUseCase(fn)`/`wrapResolver` helper shared by both (and by the equivalent `addApiKeySchema.ts`, not diffed by jscpd but following the same shape).
- `packages/api-core/src/features/users/CreateUser/schema.ts:11-21` and `packages/api-core/src/features/users/UpdateUser/schema.ts:4-14` duplicate the same Zod field validation block (name/email shape) — minor, low severity.
- `packages/api-core/src/features/ai/Ai.ts:92-101` (`listModelsByConnections`) and `:103-110` (`listModelsByConnection`) duplicate the `factory.models.map(m => toAiModel(factory, m.id, m.name))` mapping logic (jscpd: lines 95-100 vs 105-112); could share a private helper that resolves a connection's models given a `sdkName`.
- `packages/api-core/src/features/task/TaskDefinition/abstractions.ts:228-240` and `:266-278` (jscpd) — the `TaskHandler`/`TaskDefinition` namespaces re-declare an identical `LifecycleHookParams<I, O>` type alias; purely mechanical, not worth changing on its own.
- Outside this slice's core logic, jscpd also flags substantial self-duplication inside test files (`models/cms/PrivatePage/__tests__/PageModelFactory.test.ts`, `models/cms/__tests__/PrivateCmsModelBuilder.test.ts`, `models/base/__tests__/ModelBuilder.test.ts`) — repeated setup/assertion blocks across test cases in the same file. Not a production-code concern, but a candidate for shared test fixtures/helpers if these files are touched again.
- No duplication of lower-level dependency utilities was found: `Ai.ts` uses `@webiny/utils`'s `mdbid` correctly, `WcpContext.ts` uses `@webiny/error`'s `WError` correctly, and none of the sampled code reimplements `@webiny/api-graphql`'s `Response`/`ErrorResponse` envelope (it imports and uses it directly throughout `graphql/`).

## Dead code

- `packages/api-core/src/models/base/ModelFactory.ts` is a 0-byte/empty file — dead file, either finish it or remove it.
- `packages/api-core/src/domain/tenancy/errors.ts` is empty — same as above.
- `packages/api-core/src/idp/JwksCache.ts`'s `clearCache()` method (see Bugs #2) is unreferenced anywhere in the monorepo (codegraph: no callers) — either wire it into a periodic/TTL invalidation path or remove it.
- `packages/api-core/src/features/webhooks/WebhookSignPayload/abstractions.ts` and `WebhookVerifyPayload/abstractions.ts` declare abstractions with no implementation registered anywhere in this package (unlike `WebhookDispatcher`, which has a `NullWebhookDispatcher` fallback registered in `ApiCoreFeature`). Not necessarily dead — likely intended to be implemented by an adapter package — but there is no null/default implementation, so resolving either abstraction without an adapter registered will throw a DI resolution error rather than failing gracefully like `WebhookDispatcher` does.

## Convention issues

- Several internal `index.ts` files re-export their entire `abstractions.ts` with `export * from "./abstractions.js"` (`features/eventPublisher/index.ts`, `features/task/TaskController/index.ts`, `features/task/TaskDefinition/index.ts`, `features/task/TaskService/index.ts`) rather than naming exports explicitly. This is inside the package's own feature folders (not the package's public barrel, which is curated), so the risk is lower, but it's a deviation from the "minimal, explicit barrel exports" convention used almost everywhere else in the package (every other feature's `index.ts` lists exports by name).
- `packages/api-core/src/features/ai/AnthropicSdkFactory.ts` and `OpenAiSdkFactory.ts` hardcode static model-id lists inline in the implementation file rather than in a separate constants module; minor, doesn't block readability given the files are otherwise single-purpose.

## Test gaps

- No test coverage was found (within this slice, `__tests__` folders were only skimmed, not exhaustively enumerated) for `TenancyFeature`'s tenant-cache wiring itself — see Bugs #1 (private security notes) for what a regression test there would need to cover.
- `idp/JwtAuthenticator.ts:20` carries a `// TODO: validate expiration claim and exit early if expired` comment — the authenticator's own top-level dispatch does not check token expiry before consulting providers (actual signature/claims verification happens later, per-provider, in `OidcJwtIdentityProvider.verifyToken`). Whether every registered provider always enforces `exp` was not verified within this slice (`verifyJwtUsingJwk` lives in `features/security`, out of scope for this audit), so this is flagged as a test/documentation gap rather than a confirmed bug.
- The encryption feature has an untested configuration edge case (details in private security notes).

## Recommendations

1. Address the tenancy finding in Bugs #1 — see the private security notes for the full writeup and fix.
2. Add a TTL (or wire the existing `clearCache()`) to `JwksCache` so an OIDC provider's key rotation doesn't cause silent authentication failures until the next process/container recycle.
3. Address the AI text-extraction finding in Bugs #3 — see the private security notes for the full writeup and fix.
