# @webiny/okta

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/okta` is the Okta counterpart to `@webiny/auth0`: a project extension providing an API-side `OidcIdentityProvider` implementation (`OktaIIdentityProvider`, note the naming typo) that maps a validated Okta ID token into a Webiny admin identity, plus an admin-side MobX presenter (`OktaPresenter`) built on `@okta/okta-auth-js` that drives the login screen. It is a close structural mirror of `@webiny/auth0`, sharing the same DI wiring and abstractions shape, and — because both delegate token verification to `@webiny/api-core`'s shared OIDC path — the same security finding (tracked privately, see Bugs) and complete absence of tests. Downstream code should reuse `@webiny/api-core`'s `OidcIdentityProvider`/`JwkCache` machinery as this package does rather than reimplementing JWKS handling; note `@webiny/api-core`'s level-4 audit found its `JwksCache` never expires entries, which this package's token verification relies on.

## Public API
- `Okta` (project extension, `src/Okta.tsx`) — the top-level `defineExtension` a project renders to enable Okta; wires env vars and registers the API (`OktaIdpFeature`) and Admin (`admin/Extension.tsx`) extensions. Single consumer: whichever project config renders it.
- `OktaIdpConfig` (`src/api/features/OktaIdp/abstractions.ts`) — the DI abstraction a project implements to supply `getIdentity`/`verifyTokenClaims`; re-exported from the package root. No internal consumer other than the package's own `OktaIIdentityProvider`.
- `OktaIIdentityProvider` (api) / `OktaPresenter` (admin) — internal DI implementations, not part of the intended external surface.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/okta/src/api/features/OktaIdp/OktaIIdentityProvider.ts` | Security finding SEC-25 — see private notes. | — | medium |
| 2 | low | `packages/okta/src/admin/features/Okta/OktaPresenter.ts` | Security finding SEC-26 — see private notes. | — | low |

## Duplication
- `packages/okta/src/admin/components/View.tsx` and `LoginContent.tsx` are near line-for-line duplicates of `@webiny/auth0`'s equivalents (differing only in import style, the icon import, and two user-facing strings). Candidate for extraction into a shared internal helper rather than being copy-pasted per identity-provider package.
- `OktaIIdentityProvider.ts`, `abstractions.ts`, and `feature.ts` mirror `@webiny/auth0`'s equivalents almost exactly (env var names and the `.okta.com`/`.auth0.com` suffix check are the main differences) — expected for the one-adapter-per-provider pattern, but means any fix from Bugs #1 must be applied identically in both places.
- No intra-package clones were reported by jscpd (all files scored `duplicatedLines: 0`).

## Dead code
- `View.Footer` and `View.Error` (`packages/okta/src/admin/components/View.tsx:38-46,71-83`) are exported but never used anywhere in the package; codegraph confirms no consumers beyond the file's own definitions.

## Convention issues
- `OktaIIdentityProvider` (class name, file name `OktaIIdentityProvider.ts`, and exported const) has a doubled "I" — almost certainly a typo for `OktaIdentityProvider`, and inconsistent with the sibling `Auth0IdentityProvider` naming in `@webiny/auth0`. Purely cosmetic (TypeScript doesn't care), but it's the one place naming has visibly drifted between the two otherwise-parallel packages.
- `Okta.tsx` (project extension) imports the plain `EnvVar` from `@webiny/project/extensions/index.js`, whereas `@webiny/auth0`'s equivalent imports `Infra.EnvVar` from `@webiny/project-aws/infra.js` for the same purpose — a minor, purely cosmetic drift between the two adapters.

## Test gaps
There are no `__tests__` directories anywhere in this package. Untested behavior includes: `OktaIdentityProviderImpl.isApplicable`'s issuer-suffix matching, `getIdentity`'s forcing of `type`/`profile.external`, the `verifyTokenClaims` passthrough, and the entire `OktaPresenterImpl` login/logout/redirect-callback/`authStateManager` subscription flow.

## Recommendations
1. Address Bugs #1 (see private security notes).
2. Address Bugs #2 (see private security notes).
3. Rename `OktaIIdentityProvider`/`OktaIIdentityProvider.ts` to fix the naming typo (align with `Auth0IdentityProvider`'s convention), and add basic test coverage for the identity-provider and presenter logic.
