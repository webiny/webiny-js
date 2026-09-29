# @webiny/api-audit-logs

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-audit-logs` is the backend Audit Logs feature: a license-gated (`FeatureFlags.isEnabled("auditLogs")`) `AuditLogsContextValue` facade (create/update/get/list) backed by a pluggable `IStorage` abstraction (implemented downstream in `api-audit-logs-ddb`/`api-audit-logs-sql`), a small GraphQL query schema, and ~40 domain-event subscription handlers that translate lifecycle events from `api-core` (security: API keys, roles, teams, users), `api-mailer`, `api-file-manager`, `api-headless-cms`, `api-aco`, `api-website-builder` and AI powerups into audit-log entries via a shared `getAuditConfig`/`createAuditLog` helper. Health is mixed: writes are handled carefully (tenant is always server-derived, mailer settings are never logged with the SMTP password because `api-mailer`'s own event payload type already strips it, API-key tokens are stripped before logging, records are immutable — there is no delete API), actor identity is captured correctly even when the write runs inside `IdentityContext.withoutAuthorization` (that call only bypasses the internal `al.*` permission check, it never changes what `getIdentity()` returns, and scheduled/background tasks set a real `AuthenticatedIdentity` before executing), and tenant scoping is enforced by always overriding the caller-supplied tenant with the current `TenantContext`. However, one security finding was found — see private notes — and there is a real completeness gap: no login/authentication event is audited anywhere in this package (only API key, role, team and user CRUD are wired up), so failed/successful logins are invisible to the audit trail.

## Public API
- `AuditLogsFeature` (`src/AuditLogsFeature.ts:20`) — the composition root; registered from the standalone/AWS API request stack alongside the other `*Feature`s. Gated on the `auditLogs` license flag; when disabled it registers nothing.
- `AuditLogsContext` / `AuditLogsStorage` (`src/abstractions.ts`) — DI tokens. `AuditLogsStorage` has no implementation in this package; it is implemented by `api-audit-logs-ddb` and `api-audit-logs-sql` (confirmed via grep — both packages reference `AuditLogsStorage`).
- `AuditLogsContextValue` (`src/context/AuditLogsContextValue.ts`) — `createAuditLog`/`updateAuditLog`/`getAuditLog`/`listAuditLogs`; consumed by the GraphQL resolvers in this package and, via `context.auditLogs`, by all ~40 subscription handlers (through `getAuditConfig`).
- Domain events (`src/events/*`, re-exported from `src/index.ts` transitively via barrel) — `AuditLogBeforeCreateEvent`/`AuditLogAfterCreateEvent`/`AuditLogBeforeUpdateEvent`/`AuditLogAfterUpdateEvent` — an extension point for other packages/extensions to react to audit-log writes; no in-repo consumers found besides the package's own `AuditLogsContextValueImpl`, so this is effectively a public extensibility hook rather than an internally-used one.
- `getAuditConfig`/`AUDIT` (`src/utils/getAuditConfig.ts`, `src/config.ts`) — the per-action helper every subscription handler uses to build and (optionally, for "delayed"/coalesced actions such as publish-state edits) merge audit-log entries; internal to this package, not exported from the barrel.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-audit-logs/src/context/AuditLogsContextValue.ts` | Security finding SEC-50 — see private notes. | — | high |
| 2 | medium | `packages/api-audit-logs/src/subscriptions/index.ts`, `src/config.ts`, `@webiny/common-audit-logs` | No authentication/login event is subscribed to or defined anywhere in this package (only API key/role/team/user CRUD are wired up under `subscriptions/security`); `@webiny/common-audit-logs`'s `apps` catalog likewise has no login/auth action for the Security app. | An admin logs in (successfully or with a wrong password/MFA) and the event is invisible in the Audit Logs UI — there is no way to reconstruct "who logged in when" or spot repeated failed logins from this feature, even though API-key/role/user changes made in the same session are fully logged. | high |

## Duplication
- `cleanupApiKey` (the function that strips the `token` field before logging an API key) is implemented four times with byte-identical bodies: as a standalone exported helper in `src/subscriptions/security/handlers/cleanupApiKey.ts:7`, and again as a private, unexported copy inside `AuditLogApiKeyAfterCreateHandler.ts:13`, `AuditLogApiKeyAfterUpdateHandler.ts:13`, and `AuditLogApiKeyAfterDeleteHandler.ts:13`. jscpd confirms two of the three pairwise clones (24 duplicated lines each) between the Create/Update/Delete handler files. The three handlers should import the shared helper from `cleanupApiKey.ts` instead of re-declaring it.
- The ~40 subscription handler files (`src/subscriptions/**/handlers/*.ts`) all follow the exact same 20-30 line shape (`try { getAuditConfig(AUDIT....); createAuditLog(...) } catch { throw WebinyError.from(...) }`). This is intentional, readable repetition rather than accidental duplication — jscpd only flags the `cleanupApiKey` case above as a true clone — so it is not reported as a problem beyond that one helper.

## Dead code
- `cleanupApiKey` exported from `src/subscriptions/security/handlers/cleanupApiKey.ts:7` has no consumers — grep across the package confirms only the file itself references it; `AuditLogApiKeyAfterCreateHandler.ts`, `AuditLogApiKeyAfterUpdateHandler.ts`, and `AuditLogApiKeyAfterDeleteHandler.ts` each define and use their own private, duplicated copy instead (see Duplication). The whole file appears to be the intended shared implementation that was never wired in.

## Convention issues
None found that rise above the duplication/dead-code items already listed. The DI abstraction/implementation split, one-feature-per-subscription-module layout (`subscriptions/<app>/index.ts` + `handlers/*.ts`), and namespace-typed abstractions (`AuditLogsContext`, `AuditLogsStorage`, event handler abstractions) are applied consistently throughout.

## Test gaps
- `__tests__/filtering.test.ts` and `__tests__/tenantIndex.test.ts` cover filter/pagination behavior only. Security finding SEC-50 needs a regression test — see private notes.
- No test covers the `getAuditConfig`'s "delayed"/coalescing path (`createOrMergeAuditLog` in `src/utils/getAuditConfig.ts:37-75`) merging a new `after` payload into an existing entry's `before` — the merge logic (falling back to `payload.content` when there's no prior `before`) is untested.
- No test exercises the license-gate branch in `AuditLogsFeature.ts:25-27` (nothing registered when `auditLogs` is disabled).

## Recommendations
1. Address security finding SEC-50 (see private notes) and add a regression test.
2. Decide whether login/authentication events should be part of this feature's audit trail; if so, add a `Login`/`Auth` action to `@webiny/common-audit-logs` and a corresponding subscription handler, following the existing `security/handlers` pattern.
3. Delete the three duplicated private `cleanupApiKey` functions in the API-key handlers and import the shared one from `cleanupApiKey.ts` instead, removing the duplication jscpd flags.
