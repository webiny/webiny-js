# @webiny/webhooks

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/webhooks` implements outbound webhooks for the Webiny CMS: CRUD for webhook definitions, a dispatcher that fans an internal event out to all enabled matching webhooks, a background-task-driven delivery pipeline (HMAC signing via `standardwebhooks`, retry/backoff, delivery logging with a 10-year default retention), and a matching Admin UI (list/form/settings/delivery log pages). The DI use-case/repository/feature structure is consistent and closely follows `AGENTS.md` conventions, and secrets are encrypted at rest via `api-core`'s `Encryption`/CMS `.encrypt()` field, which is the correct reuse of that level-4 primitive. However, two security findings are tracked privately (SEC-41, SEC-42), plus a real (non-security) HMAC-encoding mismatch between signing and verification that likely breaks legitimate signature verification for plain-text secrets.

## Public API
- `createWebhooks` / `WebhooksFeature` (`src/api/index.ts`, `src/api/WebhooksFeature.ts`) — registers the full webhooks DI composition (models, GraphQL schemas, CRUD, dispatcher, delivery task) into a Webiny API app; the framework-level extension point other backends wire in.
- `Webhook`, `WebhookDelivery`, `IWebhookPayload` domain types (`src/exports/api/webhooks.ts`) — re-exported for consumers that need the shape without depending on internals; no other webhooks package appears to import these directly, so cross-package consumption is effectively none today (used only within this package and its own tests, per codegraph).
- `WebhookSignPayload`/`WebhookVerifyPayload` abstractions (declared in `@webiny/api-core/features/webhooks`, implemented here) — `WebhookSignPayload` is consumed by `SendWebhookTask`; `WebhookVerifyPayload` has no runtime consumer (see Dead code).
- `@webiny/sdk`'s `createVerifyWebhookPayload` (level-0 `sdk`, not part of this package) is the customer-facing counterpart to this package's signing; see Bugs for the encoding mismatch between the two.
- Admin UI features (`src/admin/features/*`, `src/admin/presentation/*`) — `ListWebhooks`, `WebhookForm`, `WebhookSettings`, `WebhookDeliveriesPage`, wired into the Admin UI via `src/admin/routes.ts`/`src/admin/index.ts`; consumed only by the Admin app shell, not by other packages.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/webhooks/src/api/utils/isValidEndpointUrl.ts` | Security finding SEC-41 — see private notes. | — | high |
| 2 | medium | `packages/webhooks/src/api/graphql/WebhookCrudSchema.ts` | Security finding SEC-42 — see private notes. | — | medium |
| 3 | high | `packages/webhooks/src/api/features/WebhookSignPayload/WebhookSignPayload.ts:24-31` vs. `packages/webhooks/src/api/features/WebhookVerifyPayload/WebhookVerifyPayload.ts:13` and `packages/sdk/src/methods/webhooks/verifyWebhookPayload.ts:27` | `WebhookSignPayloadImpl.ensureBase64` always wraps a plain-text secret as `whsec_<base64(secret)>` before constructing `new Webhook(...)`, so `standardwebhooks`'s constructor strips the prefix and base64-decodes back to the original secret bytes as the HMAC key. Both the server-side `WebhookVerifyPayloadImpl.verify` and the SDK's `createVerifyWebhookPayload` instead call `new Webhook(secret)` with the raw, un-wrapped secret. Since the admin UI lets operators type an arbitrary plain-text string as `signingSecret` (`CreateWebhookInputSchema`/`UpdateWebhookInputSchema` just require a string), and that string will almost never itself be valid base64, `standardwebhooks` will `base64.decode()` a different byte sequence than what was used to sign — producing a different HMAC key on the verify side. | A customer who configures a normal, human-typed signing secret and later verifies inbound webhook deliveries with `@webiny/sdk`'s `createVerifyWebhookPayload(secret)` (the officially documented verification path) will get `WebhookVerificationError: No matching signature found` for every legitimately-signed payload, because the key derived from their plain-text secret does not match the key `SendWebhookTask` actually signed with. | high |

## Duplication
jscpd found 12 clone pairs (141 duplicated lines, 1.78%), all within the package:
- Structural repeats across the CRUD feature-slices (expected for this codebase's one-feature-per-file convention, not worth deduplicating): `GetWebhookSettingsRepository.ts`/`UpdateWebhookSettingsRepository.ts` (27-41 / 40-...), `GetWebhookDeliveryRepository.ts`/`UpdateWebhookDeliveryRepository.ts` (24-41 / 32-...), `GetWebhookRepository.ts`/`UpdateWebhookRepository.ts` (21-31 / 21-...), `CreateWebhookDeliveryRepository.ts`/`UpdateWebhookDeliveryRepository.ts` (25-32 / 32-...), `ListWebhookDeliveries/abstractions.ts`/`ListWebhooks/abstractions.ts` (30-43 / 30-...), `ListWebhookDeliveriesRepository.ts`/`ListWebhooksRepository.ts` (47-71 / 45-...).
- `TriggerWebhookUseCase.ts:43-50` duplicates `WebhookDispatcher.ts:45-...` and `ResendWebhookDeliveryUseCase.ts:47-56` duplicates `TriggerWebhookUseCase.ts:41-...` — the "compute retention/expiry and call `createDeliveryRepository`" block is copy-pasted three times; a small shared helper (e.g. `computeDeliveryExpiry(settingsRepository)`) would remove this.
- Admin UI: `DeliveryList.tsx:37-49` / `WebhookListContent.tsx:42-...`, `WebhookFormPresenter.ts:195-202` / `:176-...` (self-duplicate), `Webhooks.tsx:30-41` / `:29-...` (self-duplicate) — minor table-column/layout boilerplate.
- `WebhookCrudSchema.ts:141-151` / `WebhookDeliverySchema.ts:84-...` — near-identical resolver boilerplate for `Query`/`Mutation` root-field stubs.

No reimplementation of lower-level (`api-core`, `utils`, `sdk`) utilities was found; the package correctly reuses `Encryption`-backed `.encrypt()` model fields rather than rolling its own secret storage, and correctly reuses `TaskService`/`TaskDefinition` from `background-tasks`/`api-core` for the delivery pipeline instead of a custom queue.

## Dead code
- `WebhookVerifyPayload` (`packages/webhooks/src/api/features/WebhookVerifyPayload/WebhookVerifyPayload.ts`) is registered by its own `feature.ts`, but that feature is never invoked from `WebhooksFeature.register()` (`packages/webhooks/src/api/WebhooksFeature.ts`) — codegraph shows its only callers are its own `feature.ts`. It is unreachable in the actual composed application; it appears to be a scaffold for a future "verify inbound webhook" endpoint that was never wired up (and, per Bug #3, would need its base64 handling fixed before being used).

## Convention issues
- One violation of the "one abstraction/implementation per file" pattern is borderline-acceptable: `WebhookDeliver.ts` defines both the exported class and a private `IAttemptResult` interface — fine, since the interface is purely internal.
- No inline object-type violations or barrel-export bloat were found; `src/exports/api/webhooks.ts` exports only domain types and the `createWebhooks` entry point, matching the "minimal barrel exports" convention.
- DI naming is consistent throughout (`XyzUseCase`/`XyzRepository`/`XyzGateway` file names matching their class/export names).

## Test gaps
- Security finding SEC-41 has no regression test (see private notes).
- No test exists for `WebhookDeliver`'s redirect handling (the package has no test that a redirect response is followed, or where it goes), and none for the sign/verify base64-encoding mismatch described in Bug #3 — `WebhookSignPayload.test.ts` and `WebhookVerifyPayload.test.ts` each test their own implementation in isolation, never a sign-then-verify round trip with a plain-text secret, which is exactly what would have caught the mismatch.
- `WebhookDeliver.test.ts` was not inspected line-by-line for retry/backoff edge cases (e.g. `Retry-After` header parsing) beyond confirming the file exists; worth a follow-up read if this package is revisited.

## Recommendations
1. Address security findings SEC-41 and SEC-42 (see private notes).
2. Stop returning the decrypted `signingSecret` from `getWebhook`/`listWebhooks`/the admin list query; require a distinct elevated permission or a one-time "reveal on creation" flow instead (see private security notes).
3. Fix the sign/verify base64-encoding asymmetry (Bug #3) by making `WebhookVerifyPayloadImpl.verify` (and the SDK's `createVerifyWebhookPayload`) apply the same `ensureBase64`-style wrapping `WebhookSignPayloadImpl.sign` uses, and add a sign-then-verify round-trip test with a plain-text secret to prevent regression.
