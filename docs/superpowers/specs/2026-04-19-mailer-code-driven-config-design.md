# Code-Driven Mailer Configuration via `<Infra.Mailer.Smtp>`

**Date:** 2026-04-19
**Packages:** `packages/project-aws`, `packages/api-mailer`, `packages/app-mailer`
**Status:** Design — ready for user review
**Depends on:** the encryption-removal refactor (branch `bruno/refactor/api-mailer/encryption`), which is prerequisite context for the current `MailerService`/`GetSettingsRepository`/`SaveSettingsUseCase` shape.

## Goal

Let developers configure mailer SMTP settings in `webiny.config.tsx` the same way they already configure encryption — via an `<Infra.Mailer.Smtp ... />` React-like extension that emits a `BuildParam` consumed at runtime. When code defines settings, they take precedence over the KV store; the admin UI becomes read-only and the `saveSettings` mutation is rejected.

Non-interactive secret handling (D3b): operators are expected to pass `password={process.env.SMTP_PASSWORD}` at build time. We do not integrate with a secret manager in this PR — the build artifact contains the password in plaintext, same as any other code-declared value. This is accepted and will be documented.

## Non-goals

- **Pluggable transport abstraction.** Transport selection remains "last-registered-factory-wins". No new transports are introduced. Tracked separately.
- **Non-SMTP code components** (`Infra.Mailer.Ses`, `Infra.Mailer.SendGrid`, `Infra.Mailer.Dummy`, etc.). Only `Infra.Mailer.Smtp` is delivered here. Follow-up PRs add siblings.
- **Validation schema changes.** The existing `SaveSettings/validation.ts` schema (port/replyTo/password optional on update) stays as-is. "Update without password" still preserves the stored password for the storage path.
- **Secret-manager integration** (AWS SSM, Secrets Manager, Vault). The `password` prop accepts any string; operators pass it via `process.env.*`. Out of scope for this PR.
- **Bypassing the "last factory wins" selection logic** based on code presence. Code settings only apply if the matching transport is the active one.

## Current state (after encryption-removal refactor)

- `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts` reads `TransportSettings` from the KV store, decrypts the password via api-core `Encryption`, returns `Result<TransportSettings | null>`.
- `GetSettingsRepository.get()` takes no arguments — it returns "the settings", singular.
- `packages/api-mailer/src/features/SaveSettings/SaveSettingsUseCase.ts` checks `mailer.settings` permission, validates input, publishes before/after events, and writes through `SaveSettingsRepository`. No notion of locked-by-code.
- `packages/api-mailer/src/features/MailerService/MailerService.ts` calls `getSettingsRepository.get()`, fails with `NoSettingsConfiguredError` if nothing persisted, otherwise picks the last-registered `MailTransportFactory` and asks it to build a transport from those settings.
- `packages/api-mailer/src/graphql/settings.ts` exposes a `getSettings` query and `saveSettings` mutation. Current behavior: strip `password` from the response payload before returning (password never leaves the server).
- `packages/app-mailer/src/views/settings/Settings.tsx` renders the settings form, driven by the `GET_SETTINGS_QUERY` GraphQL query, with a `SAVE_SETTINGS_MUTATION` on submit.
- `<Infra.Encryption>` at `packages/project-aws/src/extensions/Encryption.tsx` is the reference pattern: a `defineExtension`-defined component whose `render()` emits `<BuildParam>` children.

## Target design

### 1. Config-component layer (`packages/project-aws`)

Add `packages/project-aws/src/extensions/Mailer/Smtp.tsx`:

```tsx
import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

export const Smtp = defineExtension({
    type: "Infra/Mailer/Smtp",
    tags: { runtimeContext: "project" },
    description: "Configure mailer SMTP transport settings via code.",
    paramsSchema: z.object({
        host: z.string().min(1).describe("SMTP server hostname."),
        port: z.number().int().positive().describe("SMTP server port."),
        user: z.string().min(1).describe("SMTP authentication username."),
        password: z.string().min(1).describe("SMTP authentication password."),
        from: z.string().email().describe("Default 'from' address."),
        replyTo: z.string().email().optional().describe("Default 'reply-to' address.")
    }),
    render(params) {
        return (
            <BuildParam paramName="Mailer.SmtpSettings" value={params} />
        );
    }
});
```

Notes:

- Props match the existing `TransportSettings` interface one-to-one. `replyTo` stays optional because it is optional in `TransportSettings`. Everything else is required at the component level (stricter than `SaveSettings` validation — acceptable because code can always be fixed; we want build-time feedback rather than runtime failures).
- One `BuildParam` emitted with key `Mailer.SmtpSettings`, value is the full settings object. The BuildParam system already supports nested object values (`AdminBuildParam.ts` permits `record`, `array`, `string`, `number`, `boolean`).
- Per E2a: the extension definition is **not** marked `multiple: true`, so registering the same extension twice yields a build-time error from the definition processor — consistent with `<Infra.Encryption>`, which is also single-instance. If a consumer tries to pass `multiple: true` this file will be flipped explicitly to `false`.

Update `packages/project-aws/src/extensions/index.ts` to add `export { Smtp as MailerSmtp } from "./Mailer/Smtp.js";` (rename-on-export to avoid colliding with the existing `Smtp` name anywhere else, and to carry the domain qualifier). Update `packages/project-aws/src/extensions/definitions.ts` to include `Smtp.def` (imported from `./Mailer/Smtp.js`).

Update `packages/project-aws/src/infra.ts` to expose the component under `Infra.Mailer.Smtp`:

```ts
import { Smtp as MailerSmtp } from "./extensions/Mailer/Smtp.js";

// within the Infra object:
Mailer: {
    Smtp: MailerSmtp
}
```

### 2. Runtime abstraction: `CodeMailerSettings` (`packages/api-mailer`)

New abstraction at `packages/api-mailer/src/domain/CodeMailerSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export interface ICodeMailerSettings {
    get(transportName: string): TransportSettings | null;
}

export const CodeMailerSettings =
    createAbstraction<ICodeMailerSettings>("CodeMailerSettings");

export namespace CodeMailerSettings {
    export type Interface = ICodeMailerSettings;
}
```

New implementation at `packages/api-mailer/src/features/CodeMailerSettings/CodeMailerSettingsImpl.ts`:

```ts
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CodeMailerSettings as Abstraction } from "~/domain/CodeMailerSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";

const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";
const SMTP_BUILD_PARAM_KEY = "Mailer.SmtpSettings";

class CodeMailerSettingsImpl implements Abstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    get(transportName: string): TransportSettings | null {
        if (transportName !== SMTP_TRANSPORT_NAME) {
            return null;
        }
        const value = this.buildParams.get<TransportSettings>(SMTP_BUILD_PARAM_KEY);
        return value ?? null;
    }
}

export const CodeMailerSettings = Abstraction.createImplementation({
    implementation: CodeMailerSettingsImpl,
    dependencies: [BuildParams]
});
```

Per E1a: unknown transport names simply return `null` (KV fallback kicks in). No hard fail at startup — the caller decides what to do when nothing matches.

New feature wiring at `packages/api-mailer/src/features/CodeMailerSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CodeMailerSettings } from "./CodeMailerSettingsImpl.js";

export const CodeMailerSettingsFeature = createFeature({
    name: "Mailer/CodeMailerSettings",
    register(container) {
        container.register(CodeMailerSettings).inSingletonScope();
    }
});
```

Register inside `createMailerContext` in `packages/api-mailer/src/index.ts`, before the features that depend on it (at minimum before `GetSettingsFeature` and `SaveSettingsFeature`).

### 3. `GetSettingsRepository` gains `CodeMailerSettings` + transport-name argument

Signature change: `IGetSettingsRepository.get()` → `IGetSettingsRepository.get(transportName: string)`.

Flow in `get(transportName)`:

1. Ask `this.codeSettings.get(transportName)`. If non-null: return `Result.ok({ settings, source: "code" })`.
2. Otherwise read from KV as today. Decrypt password. If settings exist: return `Result.ok({ settings, source: "storage" })`. If not: return `Result.ok({ settings: null, source: null })`.

The return type of `IGetSettingsRepository.get()` changes from `Promise<Result<TransportSettings | null>>` to:

```ts
interface SettingsWithSource {
    settings: TransportSettings | null;
    source: "code" | "storage" | null;
}

get(transportName: string): Promise<Result<SettingsWithSource>>;
```

`GetSettingsUseCase.execute()` propagates the same `SettingsWithSource` shape up. The use case now also takes a `transportName`, because the callers (`MailerService` and the GraphQL resolver) know the transport to ask about.

### 4. `MailerService.sendMail` passes the active transport name

Current code in `MailerServiceImpl.sendMail`:

```ts
const result = await this.getSettingsRepository.get();
const settings = result.value;
```

Becomes:

```ts
const transportName = this.resolveActiveTransportName();
if (!transportName) {
    return Result.fail(new NoTransportAvailableError());
}

const result = await this.getSettingsRepository.get(transportName);
if (result.value.settings === null) {
    return Result.fail(new NoSettingsConfiguredError());
}

const settings = result.value.settings;
const transport = await this.getTransport(settings);
```

`resolveActiveTransportName()` is a small new private method that returns `this.transportFactories[...].name` — **but** `MailTransportFactory.Interface` today does not expose a `name`. Only `MailTransport.Interface` does. To avoid constructing a transport just to ask its name, extend `IMailTransportFactory` with a `name: string` readonly property. Update both existing factories (`SmtpMailTransportFactory`, `DummyMailTransportFactory`) to expose it. Name values:

- `SmtpMailTransportFactory.name = "Mailer/SmtpTransport"`
- `DummyMailTransportFactory.name = "Mailer/DummyTransport"`

(These match the `MailTransport.name` values their produced transports expose.)

### 5. `SaveSettingsUseCase` rejects when code defines settings

Add a new dependency: `CodeMailerSettings` plus a way to discover the active transport name. To keep `SaveSettingsUseCase` decoupled from the transport factory list, inject an `ActiveTransport` helper:

Abstraction at `packages/api-mailer/src/domain/MailTransport/abstractions.ts` (extend the existing file, do not create a new one):

```ts
export interface IActiveTransport {
    name(): string | null;
}

export const ActiveTransport = createAbstraction<IActiveTransport>("ActiveTransport");
export namespace ActiveTransport {
    export type Interface = IActiveTransport;
}
```

Implementation at `packages/api-mailer/src/features/MailerService/ActiveTransport.ts`:

```ts
class ActiveTransportImpl implements ActiveTransport.Interface {
    constructor(private transportFactories: MailTransportFactory.Interface[]) {}

    name(): string | null {
        if (this.transportFactories.length === 0) {
            return null;
        }
        return this.transportFactories[this.transportFactories.length - 1].name;
    }
}

export const ActiveTransport = ActiveTransportAbstraction.createImplementation({
    implementation: ActiveTransportImpl,
    dependencies: [[MailTransportFactory, { multiple: true }]]
});
```

`MailerService` and `SaveSettingsUseCase` both use this helper, so the "last-wins" logic lives in one place.

`SaveSettingsUseCase.execute()` flow becomes:

1. Permission check (unchanged).
2. Input validation (unchanged).
3. **New**: Resolve `activeTransportName = activeTransport.name()`. If non-null and `codeSettings.get(activeTransportName)` returns non-null → fail with `SettingsLockedByCode`.
4. Publish before-save event.
5. Call `repository.execute(input)`.
6. Publish after-save event.

New error `SettingsLockedByCode` at `packages/api-mailer/src/domain/errors.ts`, code `Mailer/Settings/LockedByCode`, message `"Mailer settings are managed by code and cannot be saved via the API."`.

### 6. GraphQL layer

`packages/api-mailer/src/graphql/settings.ts`:

**Schema change:**

```graphql
type MailerTransportSettingsResponse {
    data: MailerTransportSettings
    source: String          # "code" | "storage" | null
    error: MailerTransportSettingsError
}
```

`MailerTransportSettings` gains an always-present `password` field (previously stripped from the response). Its value is always either `"********"` (when a password is stored — code source OR KV source, both return the fixed 8-char mask per G2b) or `""` (when no password is stored).

**Resolvers:**

- `MailerQuery.getSettings`:
  1. Resolve `transportName` via the `ActiveTransport` helper (resolved from the container). If null → return `new Response({ data: null, source: null })`.
  2. Call `GetSettingsUseCase.execute(transportName)`.
  3. On success, map the settings: replace `password` with `"********"` if non-empty, `""` otherwise. Return `new Response({ data: mapped, source: result.value.source })`.
  4. On error, `new ErrorResponse(ex)` as today.

- `MailerMutation.saveSettings`:
  1. Call `SaveSettingsUseCase.execute(args.data)` as today.
  2. On success, mask password on the response `data` the same way as above.
  3. On `SettingsLockedByCode` failure, return `new ErrorResponse(result.error)` — the admin client interprets the error code.

**Input type `MailerTransportSettingsInput`**: unchanged. `password` stays optional (storage source still allows "update without password").

### 7. Admin UI (`packages/app-mailer`)

Query declarations live in `packages/app-mailer/src/views/settings/graphql.ts`. Two updates:

- **`SETTINGS_FIELDS`** currently omits `password`. Add `password` to the selection so the UI can display the masked value (`"********"` or empty).
- **`GET_SETTINGS_QUERY`** and **`SAVE_SETTINGS_MUTATION`** must select `source` at the same level as `data` and `error` (top-level on `MailerTransportSettingsResponse`, NOT nested inside `MailerTransportSettings`):

```graphql
settings: getSettings {
    data ${SETTINGS_FIELDS}
    source
    error ${ERROR_FIELDS}
}
```

- **`SettingsQueryResponse` / `SaveSettingsMutationResponse`** TypeScript interfaces: add `source: "code" | "storage" | null` on the `settings` object next to `data` and `error`.
- **`SETTINGS_FIELDS`** also gets a `password` line for the selection, matching the server's new `MailerTransportSettings.password` field.

`Settings.tsx` behavior split on `source`:

- `source === "code"`:
  - Render an `Alert` banner at the top: `"Mailer settings are managed by code. Edit webiny.config.tsx to change them."` (style: `type="info"`).
  - Render all form fields in read-only/disabled mode. Show the masked password (`"********"`) as prefilled, non-editable.
  - Hide or disable the "Save" button.
- `source === "storage"` or `null`:
  - Render the form as today, editable.
  - Password prefills as empty string (the `"********"` the server returned is a display marker; the form clears it on render so the admin sees an empty field and either types a new password or leaves it empty to preserve the stored one — storage-source "update without password" UX stays intact).

If `saveSettings` returns an error with code `Mailer/Settings/LockedByCode`, show a banner with that error's message.

### 8. Tests

**New tests:**

- `packages/api-mailer/__tests__/codeSettings.test.ts` — unit test for `CodeMailerSettingsImpl`. Register a `BuildParam` with `{ key: "Mailer.SmtpSettings", value: { host: "...", port: 587, ... } }`, resolve `CodeMailerSettings` from the container, verify:
  - `get("Mailer/SmtpTransport")` returns the full settings object.
  - `get("Mailer/DummyTransport")` returns `null`.
  - `get("nonexistent")` returns `null`.
  - With no `BuildParam` registered for the key, `get("Mailer/SmtpTransport")` returns `null`.

- `packages/api-mailer/__tests__/settings.codeSource.test.ts` — end-to-end through the GraphQL layer. Register the BuildParam, then:
  - `getSettings` returns `{ data: { host: ..., password: "********", ... }, source: "code" }`.
  - `saveSettings` returns an error response with code `Mailer/Settings/LockedByCode`.
  - `sendMail` (via `SendMailUseCase`) succeeds with a valid email (exercises the full flow end-to-end with the mocked nodemailer from existing setup).

**Updated tests:**

- `settings.crud.test.ts`:
  - `should not return response with password when saving settings` — password assertion changes from `password: ""` to `password: "********"` (since a password was provided in the save input).
  - `should return response with password when getting settings` — assertion changes from `password: input.password` to `password: "********"` (server never returns real passwords anymore).
  - `should not return response with password when updating settings` — password assertion changes from `password: ""` to `password: "********"`.
  - `should be possible to update settings without password` — password field in `getSettings` response changes from `input.password` to `"********"` (the save-without-password preservation behavior still works; what the admin sees is always masked).
  - Response objects now include `source: "storage"` where relevant.

- `settings.graphql.test.ts`:
  - `should fetch settings and there should be nothing in it` — response now includes `source: null`.
  - `should save settings and then fetch` — all four `expect(...).toEqual(...)` blocks now include `source: "storage"` and `password: "********"` in the data payload (password is no longer stripped from the response).
  - `should not have access to saving settings` — unchanged (error path is the same).

- `transporter.crud.test.ts`:
  - The `persistTransportSettings` helper saves settings via `SaveSettingsUseCase` — it continues to work because the storage source is still honored when no code settings are registered. Validation tests unchanged. The `should send an email` test exercises `GetSettingsRepository.get(transportName)` under the hood — no test-side change needed because the transport name is resolved inside `MailerService`.

### 9. File map (summary)

**`packages/project-aws`**
- `src/extensions/Mailer/Smtp.tsx` (new)
- `src/extensions/index.ts` (export Smtp)
- `src/extensions/definitions.ts` (add Smtp.def)
- `src/infra.ts` (add `Mailer.Smtp` namespace)

**`packages/api-mailer`**
- `src/domain/CodeMailerSettings/abstractions.ts` (new)
- `src/features/CodeMailerSettings/CodeMailerSettingsImpl.ts` (new)
- `src/features/CodeMailerSettings/feature.ts` (new)
- `src/domain/MailTransport/abstractions.ts` (add `ActiveTransport` abstraction; add `name: string` to `IMailTransportFactory`)
- `src/features/MailerService/ActiveTransport.ts` (new)
- `src/features/MailerService/feature.ts` (register ActiveTransport)
- `src/features/MailerService/MailerService.ts` (use `ActiveTransport.name()`, pass to repository)
- `src/features/SmtpTransport/SmtpMailTransportFactory.ts` (add `name = "Mailer/SmtpTransport"`)
- `src/features/DummyTransport/DummyMailTransportFactory.ts` (add `name = "Mailer/DummyTransport"`)
- `src/features/GetSettings/abstractions.ts` (update `IGetSettingsRepository.get` signature, add `SettingsWithSource` type)
- `src/features/GetSettings/GetSettingsRepository.ts` (accept transportName, query CodeMailerSettings first, return source)
- `src/features/GetSettings/GetSettingsUseCase.ts` (accept transportName, propagate source)
- `src/features/SaveSettings/abstractions.ts` (add `SettingsLockedByCode` to error union)
- `src/features/SaveSettings/SaveSettingsUseCase.ts` (check code settings, inject ActiveTransport + CodeMailerSettings)
- `src/domain/errors.ts` (new `SettingsLockedByCode` error class)
- `src/index.ts` (register `CodeMailerSettingsFeature` before Get/Save features)
- `src/graphql/settings.ts` (schema + resolvers for `source`, masking)
- `__tests__/codeSettings.test.ts` (new)
- `__tests__/settings.codeSource.test.ts` (new)
- `__tests__/settings.crud.test.ts` (update masking + source)
- `__tests__/settings.graphql.test.ts` (update masking + source)

**`packages/app-mailer`**
- `src/views/settings/graphql.ts` (or wherever `GET_SETTINGS_QUERY` lives — add `source` field)
- `src/views/settings/Settings.tsx` (read-only branch + banner)

## Success criteria

- [ ] `webiny.config.tsx` accepts `<Infra.Mailer.Smtp host="..." port={587} user="..." password={process.env.SMTP_PASSWORD!} from="..." replyTo="..." />` and that component emits `BuildParam("Mailer.SmtpSettings", {...})`.
- [ ] With the BuildParam registered, `GetSettingsRepository.get("Mailer/SmtpTransport")` returns `{ settings, source: "code" }` and never touches the KV store.
- [ ] Without the BuildParam, the same call returns `{ settings, source: "storage" | null }` from the KV store — existing behavior preserved.
- [ ] `SendMailUseCase.execute(...)` with code-defined settings routes through SMTP as configured, end-to-end.
- [ ] `SaveSettingsUseCase.execute(...)` with code-defined settings for the active transport fails with `SettingsLockedByCode`.
- [ ] `MailerQuery.getSettings` response includes `source` and `password` is always `"********"` or `""` in the response payload.
- [ ] `packages/app-mailer` settings form renders read-only with a banner when `source === "code"`.
- [ ] All existing mailer tests pass; new code-source tests pass.
- [ ] `yarn build -p @webiny/api-mailer`, `yarn build -p @webiny/project-aws`, and `yarn build -p @webiny/app-mailer` all succeed.
- [ ] `yarn adio` clean.

## Open questions

None. Decisions locked:

- Approach: B (dedicated `CodeMailerSettings` abstraction, `GetSettingsRepository` consults it first).
- Transport selection: last-registered-wins, unchanged.
- Component shape: G1a (one component per transport), starting with `Infra.Mailer.Smtp`.
- Admin UI signal: G2b flag on GraphQL response + fixed-length `"********"` mask always returned when a password is stored.
- Save lock: G3a (reject mutation with `SettingsLockedByCode`).
- Namespace: G4 — `Infra.Mailer.Smtp`, consistent with `Infra.Encryption`.
- Validation: G5 rolled back — existing schema unchanged.
- Duplicate component instances: E2a — last one wins (BuildParam semantics).
- Missing transport for code settings: E1a — runtime returns null, KV fallback, eventual `NoSettingsConfiguredError` if nothing anywhere.
- Admin UI when locked: E3a — read-only form + banner (not hidden).
- Password in code: D3b — `password={process.env.SMTP_PASSWORD}` is the expected idiom; plaintext in build artifact accepted.
