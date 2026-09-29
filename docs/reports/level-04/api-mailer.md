# @webiny/api-mailer

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-mailer` is the backend mail-sending feature: it exposes a `MailerService.sendMail()` abstraction backed by pluggable `MailTransport` implementations (SMTP via nodemailer, plus a no-op `DummyTransport`), settings storage (code-defined via `BuildParams` or admin-saved via an encrypted key-value entry), a `SendMailUseCase` with before/after/error domain events, and a small GraphQL schema (`mailer.getSettings`/`mailer.saveSettings`) that consistently strips the password field from every response, event payload, and log-adjacent object. Overall health is good — password handling is consciously defense-in-depth (encrypted at rest, stripped from all outward-facing payloads, with a dedicated regression test asserting the stripping invariant) — but there is one confirmed, production-reachable correctness bug where sending silently "succeeds" without actually delivering mail when SMTP is unconfigured, and a validation gap that lets a caller submit an email with no recipients at all.

## Public API
- `MailerFeature` (`src/MailerFeature.ts:11`) — the composition root that wires all of this package's DI features into a container; consumed by `@webiny/api-event-handler-core`'s `registerApiRequestStack.ts` (i.e. registered into every standalone/AWS API request stack).
- `MailerService` / `IMailerService` (`src/domain/MailerService/abstractions.ts:20`, re-exported from `src/index.ts`) — the `sendMail(data)` entry point; consumed directly by `packages/api-workflows`' `MailNotificationTransport`, `packages/self-hosted-auth`'s `PasswordResetMailer`, and the repo's `extensions/tasks/SendEmailTask.ts` example task.
- `SendMailUseCase`, `GetSettingsUseCase`/`GetSettingsRepository`, `SaveSettingsUseCase`/`SaveSettingsRepository` and their event-handler abstractions (`src/exports/api/mailer.ts`) — the package's public extension points (validated send, settings read/write, before/after/error hooks); `MailerSettingsAfterSaveEventHandler` already has a real consumer (`packages/api-audit-logs`'s `AuditLogMailerSettingsAfterSaveHandler`).
- `MailerSchemaFactory` (`src/graphql/MailerSchemaFactory.ts:135`) — registers the `mailer.getSettings`/`mailer.saveSettings` GraphQL fields via `@webiny/api-graphql`'s `GraphQLSchemaFactory`; not directly imported elsewhere (wired only through `MailerFeature`).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/api-mailer/src/features/MailerService/MailerService.ts:38-61 and packages/api-mailer/src/features/DummyTransport/DummyMailTransportFactory.ts:7-9 | `resolveTransport()` reverses the DI-registered factory list and picks the first whose `canUse()` returns true; `DummyMailTransportFactory.canUse()` always returns `true` regardless of settings, and `DummyTransportFeature` is registered unconditionally by the production `MailerFeature`. When no SMTP settings are configured (or configuration is accidentally removed), `resolveTransport` silently falls through to `DummyMailTransport`, whose `send()` unconditionally returns `{ result: true, error: null }`. | An admin who forgets to configure SMTP settings (or a self-hosted-auth password-reset flow, which calls `MailerService.sendMail` through `PasswordResetMailer`) gets a "success" result even though no email was ever sent — the caller has no way to detect that mail delivery didn't actually happen. | high |
| 2 | low | packages/api-mailer/src/features/SendMail/SendMailUseCase.ts:17-30 | The zod schema requires `subject` and (`text` or `html`), but never requires at least one of `to`/`cc`/`bcc` to be present. | A caller can invoke `SendMailUseCase.execute({ subject: "hi", text: "test" })`; validation passes, and the request only fails later inside the transport (e.g. nodemailer's own "No recipients defined" error), instead of failing fast with a clear `MailValidationError`. | medium |

## Duplication
jscpd found no clones within the package. No reimplementation of lower-level utilities was found: the package correctly reuses `@webiny/api-graphql`'s `ErrorResponse` in `MailerSchemaFactory`, `@webiny/api-core`'s `Encryption`/`KeyValueStore`/`EventPublisher`/`IdentityContext` abstractions, and `@webiny/feature`'s `createFeature`/`createAbstraction`/`Result`/`BaseError` consistently rather than hand-rolling any of them.

## Dead code
None found. The `MailBeforeSendEventHandler`/`MailAfterSendEventHandler`/`MailSendErrorEventHandler` abstractions currently have no registered implementations in the monorepo, but they are re-exported extension points (mirroring the already-consumed `MailerSettingsAfterSaveEventHandler`, which `api-audit-logs` does implement), not orphaned internal code.

## Convention issues
None found — every feature follows the one-abstraction/one-implementation-per-file layout, `Namespace.Interface` typing, and `createFeature`/`createAbstraction`/`createImplementation` are used consistently. `src/types.ts` carries a `// TODO: place types into appropriate domain abstractions` comment acknowledging that `TransportSendData`/`TransportSettings`/`TransportSendResponse` should eventually move into `~/domain/*`, which is a legitimate (if minor) structural debt the package's own author flagged.

## Test gaps
Settings CRUD, password-stripping (dedicated `saveSettingsEvents.test.ts`), code-vs-storage source precedence, and GraphQL permission checks are all well tested. Gaps: there is no test exercising `SmtpMailTransport`/`SmtpConfig` directly (default timeouts, the allow-listed error-field shape on a real send failure), no test for the `DummyTransport` fallback behavior described in Bug #1, and no test for the missing-recipients validation gap (Bug #2).

## Recommendations
1. ~~Fix the silent-success fallback (Bug #1)~~ — by design (owner decision 2026-09-28, plan Q2); no change. either gate `DummyTransportFeature` registration behind an explicit opt-in/env check, or have `MailerService.sendMail` return a distinct "no real transport configured" result instead of treating the dummy transport as an equally valid delivery path.
2. Add a `.refine()` to `SendMailUseCase`'s schema requiring at least one of `to`/`cc`/`bcc`, so a recipient-less send fails validation with a clear error instead of surfacing as a transport-level failure.
3. Add a unit test for `SmtpMailTransport`/`SmtpConfig` (mocking `nodemailer.createTransport`) covering the default-timeout merge and the allow-listed error-data shape, since this is the one path handling real SMTP credentials and is currently untested.
