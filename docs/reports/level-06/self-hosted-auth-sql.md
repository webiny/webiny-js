# @webiny/self-hosted-auth-sql

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/self-hosted-auth-sql` is the Knex/SQL storage backend for `@webiny/self-hosted-auth`'s ten storage operations: four for the credential store (get by email, get by user id, save/upsert, delete) and six for password-reset codes (save, list-live, count, increment-attempts, mark-used, delete-expired). It is small, single-purpose, and well built: it correctly reuses `@webiny/api-core-sql`'s `TableManager` (one instance shared across both tables, caching which tables it has verified, avoiding the per-call schema-check overhead flagged in the sibling `api-websockets-sql` report), stores only a `code_hash` for reset codes (never the plaintext code), enforces expiry with a `where("expires_on", ">", now)` filter, increments the attempt counter atomically in the database rather than read-modify-write, and deliberately stores no tenant on credentials — matching `@webiny/self-hosted-auth`'s own documented design that identities are tenant-agnostic (like Cognito) and tenant membership lives in the security layer, not here. The one real gap is that the package has zero automated tests despite being the persistence layer for password hashes and reset tokens.

## Public API
- `SelfHostedAuthSqlFeature` (`src/SelfHostedAuthSqlFeature.ts:21`) — the single registration entry point (wires one shared `TableManager` into both sub-features); consumed by `packages/api-event-handler-standalone-sql/src/createWebinyApiHandler.ts` (codegraph: the sole SQL project template that ships self-hosted auth).
- `CredentialsSqlFeature`/`PasswordResetCodesSqlFeature` (`src/credentials/index.ts:16`, `src/passwordResetCodes/index.ts:18`) — the two sub-features `SelfHostedAuthSqlFeature` composes; not consumed independently anywhere else in the monorepo (codegraph: only called from `SelfHostedAuthSqlFeature` and re-exported from the barrel).
- The ten `Sql*StorageOperation` implementations (e.g. `SqlGetCredentialByEmail`, `SqlSavePasswordResetCode`) — each implements one of `@webiny/self-hosted-auth`'s storage-operation abstractions; consumed only via the two sub-features above, never directly.

## Bugs
None found.

## Duplication
No jscpd clones reported (the package has no internal duplication). Each of the ten operation files follows the same three-line shape (`ensure()` the table, run one Knex query, wrap the catch in `WebinyError.from`) but this is intentional, consistent boilerplate rather than copy-pasted logic drift — every query is different and each file stays a single, focused abstraction/implementation per AGENTS.md conventions.

## Dead code
None found. All ten storage operations and both feature registrars are wired into `SelfHostedAuthSqlFeature` and reachable from the single production consumer.

## Convention issues
None found. Strict one-abstraction-per-file (`CredentialsTable`, each `Sql*` operation in its own file), DI naming matches the `Impl`-suffixed-class / abstraction-named-export pattern, and the barrel (`src/index.ts`) only exports the two features + config type — no internal DI wiring leaks out.

## Test gaps
The package has no `__tests__/` directory at all — zero automated test coverage for the credential store (password-hash persistence, upsert-on-conflict semantics in `SqlSaveCredential`) and the password-reset-code store (expiry filtering in `SqlListLivePasswordResetCodes`, atomic attempt increments in `SqlIncrementPasswordResetCodeAttempts`, the used-code race in `SqlMarkPasswordResetCodesUsed`'s `whereNull("used_on")` guard). Codegraph confirms no tests are reachable within 3 caller hops of `SelfHostedAuthSqlFeature`/`CredentialsSqlFeature`/`PasswordResetCodesSqlFeature`. Given this is the persistence layer behind `@webiny/self-hosted-auth`'s security-sensitive login/reset flows (rated the most security-sensitive package audited at level 5), the lack of any test — even a basic round-trip against `better-sqlite3` (already a dev dependency) — is a meaningful gap.

## Recommendations
1. Add unit tests for all ten storage operations against the `better-sqlite3` dev dependency already declared in `package.json`, at minimum covering: save/get/delete round-trips, the `onConflict(["user_id"]).merge(...)` upsert path in `SqlSaveCredential`, the expiry/used-on filtering in `SqlListLivePasswordResetCodes`/`SqlCountPasswordResetCodes`, and the atomic increment in `SqlIncrementPasswordResetCodeAttempts`.
2. Add a feature-level test that registers `SelfHostedAuthSqlFeature` and exercises the full password-reset lifecycle (save code → count → increment attempts → mark used → delete expired) end to end.
3. No code changes needed otherwise; the package is a good model for the "share one `TableManager`, avoid the sibling `api-websockets-sql` package's per-call schema-check pattern" approach — worth pointing to if that package is revisited.
