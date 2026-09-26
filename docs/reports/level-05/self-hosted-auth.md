# @webiny/self-hosted-auth

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/self-hosted-auth` is a self-contained, JWT-based identity provider for self-hosted Webiny installations: email/password login, self-service password reset via emailed codes, an operator "lockout escape hatch" (`webiny reset-password` CLI + a token-gated GraphQL mutation), and the admin-side login screen that consumes them. This is the most security-sensitive package audited so far, and it holds up well: it correctly reuses `@webiny/api-core`'s `Hasher` (scrypt) rather than rolling its own KDF, uses `node:crypto`'s `randomInt` (not `Math.random`) for reset codes, spends a dummy hash on unknown accounts to equalize login timing, holds every password-reset-request response to a fixed minimum duration to defeat mail-delivery timing side-channels, caps reset-code guesses and per-address reset requests, atomically increments failed-attempt counters, keeps the CLI reset-token issuer/audience strictly disjoint from the login-token issuer (with a dedicated regression test), and gates password-reset delivery on the presence of real SMTP settings rather than trusting `MailerService.sendMail()`'s success return — which sidesteps the silent-`DummyTransport`-fallback issue flagged for `@webiny/api-mailer` at level 4. Two security findings are tracked privately (SEC-29, SEC-30).

## Public API
- `SelfHostedAuth` (`src/SelfHostedAuth.tsx`) — the `webiny.config.tsx` component (`signingSecret`, `tokenExpiresIn`, `cliPasswordReset`, `emailPasswordReset` props) that wires the feature into a project; the sole entry point, consumed by project `webiny.config.tsx` files (outside this repo's own packages).
- `selfHostedAuthLogin` / `selfHostedAuthRequestPasswordReset` / `selfHostedAuthResetPassword` / `selfHostedAuthCliResetPassword` (`src/api/graphql/*.gql.ts`) — the four GraphQL mutations, all unauthenticated by design; consumed by the admin login screen (`SelfHostedAuthGateway`) and the `reset-password` CLI command.
- `SelfHostedJwtIdentityProvider` (`src/api/features/SelfHostedIdp/SelfHostedJwtIdentityProvider.ts`) — registered as one of `@webiny/api-core`'s `JwtIdentityProvider` implementations (codegraph: consumed by `JwtAuthenticator`'s fan-out, alongside Cognito/Auth0 providers).
- `ResetPasswordCommand` (`src/cli/ResetPasswordCommand.ts`) — registered as a `Cli/Command` extension point from `@webiny/cli-core`, only when `cliPasswordReset` is enabled.
- `UserInstaller` (`src/api/features/UserInstaller/UserInstaller.ts`) — an `AppInstaller` consumed by `@webiny/api-core`'s tenant-install flow to seed the first admin user.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/self-hosted-auth/src/api/features/Login/LoginUseCase.ts` | Security finding SEC-29 — see private notes. | — | high |
| 2 | low | `packages/self-hosted-auth/src/admin/presentation/SelfHostedAuthPresenter.ts` | Security finding SEC-30 — see private notes. | — | medium |

## Duplication
jscpd found only small, low-risk clones within the package: two near-identical JSX form snippets (`admin/presentation/components/RequestResetCode.tsx:4-12` vs `SignIn.tsx:6`, and `RequestResetCode.tsx:49-69` vs `SetNewPassword.tsx:67`), and three pairs of near-identical GraphQL resolver boilerplate across `auth.gql.ts`, `passwordReset.gql.ts`, and `cliResetPassword.gql.ts` (the `ErrorResponse`-mapping block repeated per mutation). None of it duplicates logic from a lower-level package — the crypto, hashing, and mailer pieces correctly delegate to `@webiny/api-core`'s `Hasher`/`BuildParams`/`Logger` and `@webiny/api-mailer`'s `SendMailUseCase`/`GetSettingsUseCase` instead of reimplementing them.

## Dead code
None found. Every domain/crypto module (`TokenIssuer`, `CliResetTokenVerifier`, `PasswordResetCodeGenerator`), repository, and use case has at least one production caller confirmed via codegraph (`SetPasswordUseCase` — checked explicitly given its authz TODO — has exactly the three expected callers: `ResetPasswordWithCodeUseCase`, `CliResetPasswordUseCase`, and `UserInstaller`, plus its own `feature.ts` wiring; no stray direct caller that would bypass the code/token verification that authorizes it).

## Convention issues
None found. The package follows the DI feature/abstraction/implementation convention consistently (one abstraction + implementation per file, `Namespace.Interface` typing, `createAbstraction`/`createImplementation`/`createFeature` used correctly throughout), and the two `TODO(authz)` comments in `SetPasswordUseCase.ts:19-21` and `DeleteCredentialUseCase.ts:9-10` are honest, accurate self-documentation of currently-unreachable gaps rather than convention violations — both use cases are, today, only reachable through call paths that already authorize the action (a verified reset code/token, or the bootstrap installer).

## Test gaps
Of ~30 non-trivial source files, 16 test files exist, but several of the most security-relevant pieces have no dedicated test, relying only on indirect coverage through use-case tests:
- `TokenIssuer` (`src/api/domain/crypto/TokenIssuer.ts`) — no test exercises `issue`/`verify` directly (expiry, wrong secret, wrong issuer, algorithm confusion); only indirectly touched via `LoginUseCase.test.ts`'s mocked dependency.
- `RequestPasswordResetUseCase` (`src/api/features/RequestPasswordReset/RequestPasswordResetUseCase.ts`) — no test file at all, despite this being the use case with the most carefully-reasoned anti-enumeration logic in the package (the `holdUntilFloor` timing equalization and the "hash spent for every address, including unregistered ones" behavior are asserted nowhere).
- `SelfHostedJwtIdentityProvider` and `PasswordResetMailer` — no dedicated test file; the `isConfigured()`/`send()` gating behavior that avoids `api-mailer`'s dummy-transport fallback is untested in isolation.
- `SetPasswordUseCase` — no direct test file (only exercised transitively through `ResetPasswordWithCodeUseCase.test.ts` and `CliResetPasswordUseCase.test.ts`), so its own password-policy and upsert logic has no test that isolates it from its callers.

## Recommendations
1. Address security finding SEC-29 (see private notes).
2. Add a direct `RequestPasswordResetUseCase.test.ts` covering the anti-enumeration behavior (identical timing/response for existing vs. non-existing accounts, the per-address request cap) — this is the most carefully engineered logic in the package and currently has zero direct test coverage.
3. Address security finding SEC-30 (see private notes).
