# @webiny/auth0

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/auth0` is a project extension that wires Auth0 into a Webiny deployment: an API-side `OidcIdentityProvider` implementation (`Auth0IdentityProvider`) that maps a validated Auth0 ID token into a Webiny admin identity, and an admin-side MobX presenter (`Auth0Presenter`) built on `@auth0/auth0-spa-js` that drives the login screen. It is structurally a near-mirror of `@webiny/okta` (same abstractions, same DI wiring style), which is good for consistency, and both packages share the same JWKS-based verification path from `@webiny/api-core` (see Bugs for a security finding tracked privately) and neither has any test coverage. Downstream packages should not reimplement OIDC identity mapping or JWKS handling — reuse `@webiny/api-core`'s `OidcIdentityProvider`/`JwkCache` abstractions the way this package does; note `@webiny/api-core`'s level-4 audit found its `JwksCache` never expires entries, which this package's token verification relies on.

## Public API
- `Auth0` (project extension, `src/Auth0.tsx`) — the top-level `defineExtension` a project's `webiny.application.ts`/config renders to enable Auth0; wires env vars and registers both the API (`Auth0IdpFeature`) and Admin (`admin/Extension.tsx`) extensions. Single consumer: whichever project config renders it (not present in this monorepo's own default project templates, i.e. it's an opt-in extension for end users).
- `Auth0IdpConfig` (`src/api/features/Auth0Idp/abstractions.ts`) — the DI abstraction a project must implement to supply `getIdentity`/`verifyTokenClaims`; re-exported from the package root. No internal consumer other than the package's own `Auth0IdentityProvider`, since it exists for downstream project code to implement.
- `Auth0IdentityProvider` (api) / `Auth0Presenter` (admin) — internal DI implementations, not part of the intended external surface (not re-exported from `src/index.ts`, only reached via the feature registration in `Auth0.tsx`).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/auth0/src/api/features/Auth0Idp/Auth0IdentityProvider.ts` | Security finding SEC-24 — see private notes. | — | medium |
| 2 | low | `packages/auth0/src/admin/features/Auth0/Auth0Presenter.ts` | Security finding SEC-26 — see private notes. | — | low |
| 3 | medium | `packages/auth0/src/admin/features/Auth0/Auth0Presenter.ts:47-48` | `hasRedirectCallback` is computed with `window.location.search.includes("code=") \|\| includes("state=")` (plain substring match) instead of parsing the query string properly (e.g. `new URLSearchParams(...).has("code")`). Okta's equivalent flow uses the SDK's own `oktaAuth.token.isLoginRedirect()`, which doesn't have this issue. | If the admin is opened with any URL that happens to contain the literal substrings `code=` and `state=` in its query string for unrelated reasons (e.g. a deep-linked path/query param), `init()` calls `auth0Client.handleRedirectCallback()` even though no real Auth0 redirect occurred; `auth0-spa-js` throws when there's no matching stored PKCE state, and the rejection isn't caught anywhere in `init()`, leaving the login screen stuck (the `checkingSession`/`loggingIn` flags are never reset on that path). | medium |

## Duplication
- `packages/auth0/src/admin/components/View.tsx` and `packages/okta/src/admin/components/View.tsx` are line-for-line identical in logic (only import style differs); same for `LoginContent.tsx` (differs only in icon import and two user-facing strings). These are strong candidates for extraction into a small shared internal helper (e.g. under `@webiny/admin-ui` or a shared "idp admin UI" module) rather than being copy-pasted per identity-provider package.
- `Auth0IdentityProvider.ts`, `abstractions.ts`, and `feature.ts` mirror `@webiny/okta`'s equivalents almost exactly (env var names and the `.auth0.com`/`.okta.com` suffix check are the only real differences). This is expected/acceptable for a one-adapter-per-provider pattern, but is worth flagging since any future fix from Bugs #1 needs to be applied in both places identically — a shared base or a single parameterized implementation would remove this duplication risk.
- No intra-package clones were reported by jscpd (all files scored `duplicatedLines: 0`).

## Dead code
- `View.Footer` and `View.Error` (`packages/auth0/src/admin/components/View.tsx:34-42,67-79`) are exported but never used anywhere in the package (`LoginContent.tsx` only renders `View.Container`/`View.Content`/`View.Title`); codegraph confirms no consumers beyond the file's own definitions.

## Convention issues
- `Auth0Feature.register` (`packages/auth0/src/admin/features/Auth0/feature.ts:7`) registers `Auth0Presenter` without `.inSingletonScope()`, while the otherwise-identical `OktaFeature.register` (`packages/okta/src/admin/features/Okta/feature.ts:8`) does use `.inSingletonScope()`. There is currently only one resolution call site (`useFeature(Auth0Feature)` in `Auth0LoginScreen.tsx`, memoized via `useMemo`), so there's no observable bug today, but the inconsistency is a latent risk if a second consumer is ever added — the two sibling packages should follow the same scoping convention.
- `Auth0.tsx` (project extension) imports `Infra.EnvVar` from `@webiny/project-aws/infra.js`, whereas `@webiny/okta`'s equivalent imports the plain `EnvVar` from `@webiny/project/extensions/index.js` for the same purpose — a minor, purely cosmetic drift between the two otherwise-parallel adapters.

## Test gaps
There are no `__tests__` directories anywhere in this package. Untested behavior includes: `Auth0IdentityProviderImpl.isApplicable`'s issuer-suffix matching, `getIdentity`'s forcing of `type`/`profile.external`, the `verifyTokenClaims` passthrough, and the entire `Auth0PresenterImpl` login/logout/session-check/redirect-callback flow (including the fragile `hasRedirectCallback` check above).

## Recommendations
1. Address Bugs #1 (see private security notes).
2. Address Bugs #2 (see private security notes).
3. Replace the substring-based `hasRedirectCallback` check with proper `URLSearchParams` parsing, add `.inSingletonScope()` to `Auth0Feature` for consistency with `@webiny/okta`, and add basic test coverage for the identity-provider and presenter logic.
