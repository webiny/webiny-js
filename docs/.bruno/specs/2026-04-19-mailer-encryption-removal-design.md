# Remove api-mailer Encryption, Use api-core Encryption

**Date:** 2026-04-19
**Package:** `packages/api-mailer`
**Status:** Design — ready for user review

## Goal

Delete the mailer-local `Encryption` abstraction and implementation, and route SMTP password encryption through the shared `Encryption` feature in `@webiny/api-core/features/encryption`. Remove all `WEBINY_API_MAILER_*` environment variables — the mailer no longer reads configuration from the environment; settings come only from the KV-backed storage written by `SaveSettingsUseCase`.

This is **step 1** of a broader refactor. Step 2 (pluggable transports) is out of scope here.

## Non-goals

- **Pluggable transport abstraction.** Tracked separately; the current `MailTransportFactory` shape is left untouched.
- **Gating saves when no encryption key is configured.** The platform-level `Encryption` is a no-op passthrough when `EncryptionPassphrase` is unset (see commit `e693256292`). That means the mailer will store SMTP passwords in cleartext in the KV store for projects without a key. We accept this for now; a follow-up PR will make `Infra.Encryption.Key` a hard requirement whenever sensitive settings are persisted.
- **Backward-compatible decryption of existing KV data.** Previously stored encrypted passwords will not decrypt with the new implementation (different salt, and the env-var source is removed). Operators will need to re-save their mailer settings after the upgrade — this is called out in the migration note.

## Current state

- **Local encryption files (to delete):**
  - `src/domain/Encryption/abstractions.ts` — local `Encryption` abstraction, async `encrypt/decrypt`.
  - `src/features/Encryption/PasswordEncryption.ts` — implementation.
  - `src/features/Encryption/feature.ts` — registration.
  - `src/features/Encryption/utils/password.ts` — AES-256-GCM helpers.
  - `src/features/Encryption/utils/secret.ts` — env-var reader for `WEBINY_API_MAILER_PASSWORD_SECRET`.

- **Env-var fallback (to delete):**
  - `src/features/MailerService/TransportFactory.ts` — `getDefaultSettingsFromEnv()` reads `WEBINY_API_MAILER_HOST/PORT/USER/PASSWORD/REPLY_TO/FROM`. The whole file is removed.
  - `MailerService.sendMail()` currently falls back to `getDefaultSettingsFromEnv()` when the repository returns no settings. This fallback is removed — if no settings are persisted, `sendMail` fails with `NoSettingsConfiguredError`.

- **Env-var typings (to delete):**
  - `typings/env/index.d.ts` — the entire `api-mailer` block (lines 66–73): `WEBINY_API_MAILER_HOST`, `WEBINY_API_MAILER_USER`, `WEBINY_API_MAILER_PASSWORD`, `WEBINY_API_MAILER_REPLY_TO`, `WEBINY_API_MAILER_FROM`, `WEBINY_API_MAILER_PASSWORD_SECRET`.

- **api-core `Encryption` (target dependency):**
  - `IEncryption.encrypt/decrypt` are **synchronous** (mailer's were async — all `await`s on `this.encryption.*` must be removed).
  - Reads `EncryptionPassphrase`, `EncryptionSalt`, `EncryptionAlgorithm` from `BuildParams` (sourced from `Infra.Encryption.Key` at project level).
  - Already registered by `ApiCoreFeature` — nothing to add in the mailer's own feature registration.

## Target design

### Call-site changes

1. **`src/features/SaveSettings/SaveSettingsRepository.ts`**
   - Swap dependency: `Encryption` from `~/domain/Encryption/abstractions.js` → `Encryption` from `@webiny/api-core/features/encryption`.
   - Remove `await` on `this.encryption.encrypt(...)` and `this.encryption.decrypt(...)` (now sync).

2. **`src/features/GetSettings/GetSettingsRepository.ts`**
   - Same swap and `await` removal as above.

3. **`src/features/MailerService/MailerService.ts`**
   - Remove the `getDefaultSettingsFromEnv()` fallback. The new flow: if `getSettingsRepository.get()` returns `null` (or the result's `value` is falsy), return `Result.fail(new NoSettingsConfiguredError())` directly.

4. **`src/graphql/settings.ts`**
   - Remove the `import { getSecret } from "~/features/Encryption/utils/secret.js"`.
   - Remove the `getSecret()` call inside `MailerQuery.getSettings` (line ~65) and its `TODO` comment. With the api-core `Encryption` no-op behavior, the resolver simply returns the decrypted settings or `null`.

5. **`src/index.ts`**
   - Remove the `EncryptionFeature.register(context.container)` call and its import. The api-core feature is already registered by the host.

### Deletions

- Delete folder: `packages/api-mailer/src/domain/Encryption/`
- Delete folder: `packages/api-mailer/src/features/Encryption/`
- Delete file: `packages/api-mailer/src/features/MailerService/TransportFactory.ts`
- Edit file: `typings/env/index.d.ts` — remove the 6 `WEBINY_API_MAILER_*` declarations and their `/** api-mailer */` section header.

### Package metadata

- `packages/api-mailer/package.json` — the `adio.ignore.src` array currently lists `node:crypto` to silence a dependency-check warning for the deleted `utils/password.ts`. Remove that entry.

### Test updates

The tests directly set `WEBINY_API_MAILER_*` env vars. All such reads must be removed, and any test that relied on env-var transport settings needs to save settings through the repository first.

1. **`__tests__/transporter.crud.test.ts`**
   - Remove the `beforeEach` block that sets env vars.
   - The `"should send an email"` test relied on env-var settings for transport config. Replace the setup: either (a) resolve `SaveSettingsUseCase` and persist settings before calling `SendMailUseCase`, or (b) mock `GetSettingsRepository` to return the desired settings. Option (a) is preferred because it exercises the real path.
   - Validation tests do not depend on transport settings — no change needed there beyond removing the env-var writes.

2. **`__tests__/settings.crud.test.ts`**
   - Remove all `process.env.WEBINY_API_MAILER_PASSWORD_SECRET` writes and the `delete process.env[...]` in `beforeEach`.
   - Delete the already-skipped test `"should not be possible to get or save settings without secret"` — the premise (mailer-owned secret requirement) no longer exists.

3. **`__tests__/settings.graphql.test.ts`**
   - Remove env-var writes.

4. **Test harness (`__tests__/handlerPlugins.ts`)**
   - The handler already wires `createHeadlessCmsContext` + `createMailerContext`, which brings in the api-core `EncryptionFeature` via its peer registration. To exercise the encrypted-round-trip path deterministically, register a fixed `BuildParam` in the test container: an implementation of the `BuildParam` abstraction (from `@webiny/api-core/features/buildParams`) that returns `{ key: "EncryptionPassphrase", value: "test-passphrase" }`. Do the same for `EncryptionSalt` if you want the salt set explicitly; otherwise the default empty salt is fine. Tests that don't register such a `BuildParam` exercise the no-op passthrough, which is acceptable for CRUD flows where the encrypted value shape is not asserted.

## Migration note (for PR description)

> Any existing mailer settings persisted in the KV store (`Mailer/Settings/Transport`) will no longer decrypt after this change. Operators must re-save their SMTP settings via the admin UI (or GraphQL `mailer.saveSettings` mutation). The `WEBINY_API_MAILER_PASSWORD_SECRET`, `WEBINY_API_MAILER_HOST`, `WEBINY_API_MAILER_PORT`, `WEBINY_API_MAILER_USER`, `WEBINY_API_MAILER_PASSWORD`, `WEBINY_API_MAILER_REPLY_TO`, and `WEBINY_API_MAILER_FROM` environment variables are no longer read — remove them from project configuration.

## Success criteria

- [ ] `packages/api-mailer/src/domain/Encryption/` and `packages/api-mailer/src/features/Encryption/` are gone.
- [ ] `SaveSettingsRepository` and `GetSettingsRepository` depend on `@webiny/api-core/features/encryption` and use synchronous encrypt/decrypt.
- [ ] `MailerService` has no env-var fallback; `sendMail` fails fast with `NoSettingsConfiguredError` when no settings are persisted.
- [ ] `graphql/settings.ts` has no `getSecret` import, no short-circuit, no TODO referencing encryption.
- [ ] No `WEBINY_API_MAILER_*` reference remains in `packages/api-mailer/**` or `typings/env/index.d.ts`.
- [ ] All `__tests__/*.ts` in `packages/api-mailer` pass under `yarn test packages/api-mailer` without setting any `WEBINY_API_MAILER_*` env var.
- [ ] `yarn build -p @webiny/api-mailer` succeeds.
- [ ] `yarn adio` passes (check that `node:crypto` ignore entry is no longer needed).

## Open questions

None. Decisions locked: env vars dropped entirely (D1a), existing-data migration by re-save only (D2a), plaintext-without-key accepted for this PR and gated in a follow-up (D3a).
