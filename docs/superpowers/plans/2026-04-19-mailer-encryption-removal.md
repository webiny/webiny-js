# Mailer Encryption Removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `packages/api-mailer`'s local `Encryption` abstraction and switch the mailer's `SaveSettings`/`GetSettings` repositories to the shared `Encryption` feature in `@webiny/api-core/features/encryption`. Drop all `WEBINY_API_MAILER_*` environment variables (both the encryption secret and the SMTP transport fallback).

**Architecture:** Pure deletion + dependency swap. The api-core `Encryption` is already registered by `ApiCoreFeature` (which runs before `createMailerContext`), so no new registrations are needed on the mailer side. `Encryption.encrypt/decrypt` is synchronous in api-core (mailer's was async), so every `await` on those calls must be removed. With no env-var fallback, `MailerService.sendMail` fails with `NoSettingsConfiguredError` whenever the KV store has no persisted settings. Existing cleartext/ciphertext compatibility is not preserved — operators re-save SMTP credentials once.

**Tech Stack:** TypeScript, Vitest, `@webiny/feature/api` DI, `@webiny/api-core` features (`Encryption`, `KeyValueStore`, `EventPublisher`, `IdentityContext`).

**Note on TDD:** This is a removal refactor, not new behavior. The pattern used throughout is: change code → run the existing test suite → confirm green. No new tests are introduced beyond rewriting one test that previously leaned on env-var transport config. One already-skipped test is deleted in Task 2 and one in Task 3.

**Commit policy:** Per `CLAUDE.md`, commits are made by the user, not by the agent. Each task ends with a **checkpoint** — stop, run the verification command, and surface the diff summary to the user. Do not run `git commit`.

**Before every task:** Make sure `yarn > /dev/null 2>&1` has been run at least once in the repo root, so dependencies are up to date.

---

## Reference file map

Files deleted by this plan:

- `packages/api-mailer/src/domain/Encryption/` (folder)
- `packages/api-mailer/src/features/Encryption/` (folder)
- `packages/api-mailer/src/features/MailerService/TransportFactory.ts`

Files modified by this plan:

- `packages/api-mailer/src/features/SaveSettings/SaveSettingsRepository.ts`
- `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts`
- `packages/api-mailer/src/features/MailerService/MailerService.ts`
- `packages/api-mailer/src/graphql/settings.ts`
- `packages/api-mailer/src/index.ts`
- `packages/api-mailer/package.json`
- `packages/api-mailer/__tests__/settings.crud.test.ts`
- `packages/api-mailer/__tests__/settings.graphql.test.ts`
- `packages/api-mailer/__tests__/transporter.crud.test.ts`
- `typings/env/index.d.ts`

---

## Task 1: Swap `SaveSettingsRepository` + `GetSettingsRepository` to api-core `Encryption`

**Why first:** These two repositories are the only mailer-side consumers of the local `Encryption`. Switching them to api-core makes the local `PasswordEncryption` implementation unreachable (safely dead). Old tests still pass because `WEBINY_API_MAILER_PASSWORD_SECRET` is still set by `beforeEach` in those tests — the api-core encryption just ignores it and runs as a no-op passthrough (still a valid round-trip for the test assertions).

**Files:**
- Modify: `packages/api-mailer/src/features/SaveSettings/SaveSettingsRepository.ts`
- Modify: `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts`

### Steps

- [ ] **Step 1: Replace `SaveSettingsRepository.ts` import and drop `await`s**

Edit `packages/api-mailer/src/features/SaveSettings/SaveSettingsRepository.ts`.

Change this import line near the top:

```ts
import { Encryption } from "~/domain/Encryption/abstractions.js";
```

to:

```ts
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
```

Remove the two `await` keywords on encryption calls inside `execute()`. The resulting method body (types unchanged) must read exactly:

```ts
async execute(input: SaveSettingsInput): SaveSettingsRepository.Return {
    // Check if settings exist
    const existingResult =
        await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);
    const existingSettings = existingResult.isOk() ? existingResult.value : null;
    const transportSettings: Partial<TransportSettings> = existingSettings ?? {};

    // If updating and no password provided, keep the existing password
    let passwordToStore = input.password || "";
    if (!input.password && existingSettings) {
        passwordToStore = this.encryption.decrypt(transportSettings.password || "");
    }

    // Encrypt password
    const encryptedPassword = this.encryption.encrypt(passwordToStore);

    // Prepare data
    const data = {
        host: input.host ?? transportSettings.host,
        port: input.port ?? transportSettings.port ?? DEFAULT_PORT,
        user: input.user ?? transportSettings.user,
        password: encryptedPassword,
        from: input.from ?? transportSettings.from,
        replyTo: input.replyTo ?? transportSettings.replyTo
    };

    // Save settings
    const result = await this.keyValueStore.set(MAILER_TRANSPORT_SETTINGS, data);

    if (result.isFail()) {
        return Result.fail(new SettingsPersistenceError(result.error));
    }

    // Return without encrypted password
    const returnSettings: TransportSettings = {
        ...data,
        password: "" // Don't return password
    };

    return Result.ok(returnSettings);
}
```

Leave the constructor and the `createImplementation` call as-is — the `Encryption` token's shape is identical (only sync-vs-async differs at the interface level), so dependency wiring is unchanged.

- [ ] **Step 2: Replace `GetSettingsRepository.ts` import and drop `await`**

Edit `packages/api-mailer/src/features/GetSettings/GetSettingsRepository.ts`.

Change this import line near the top:

```ts
import { Encryption } from "~/domain/Encryption/abstractions.js";
```

to:

```ts
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
```

Remove the `await` on the `this.encryption.decrypt(...)` call inside `get()`. The resulting method body (types unchanged) must read exactly:

```ts
async get(): Promise<Result<TransportSettings | null>> {
    const result = await this.keyValueStore.get<TransportSettings>(MAILER_TRANSPORT_SETTINGS);

    if (result.isFail()) {
        return Result.ok(null);
    }

    const settings = result.value;
    if (!settings) {
        return Result.ok(null);
    }

    // Decrypt password if present
    const password = settings.password
        ? this.encryption.decrypt(String(settings.password))
        : "";

    const transportSettings: TransportSettings = {
        host: String(settings.host || ""),
        port: Number(settings.port || 25),
        user: String(settings.user || ""),
        password,
        from: String(settings.from || ""),
        replyTo: settings.replyTo ? String(settings.replyTo) : undefined
    };

    return Result.ok(transportSettings);
}
```

- [ ] **Step 3: Build the package**

Run from repo root:

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds. If TypeScript complains about the `Encryption` type not matching, it means the old local async signatures are leaking in elsewhere — search for imports from `~/domain/Encryption/abstractions.js` and make sure only Save/Get repositories referenced them (they should be the only two).

- [ ] **Step 4: Run the full mailer test suite**

Run from repo root:

```bash
yarn test packages/api-mailer 2>&1 | tail -50
```

Expected: all tests pass, same green count as before the change. The old `PasswordEncryption` is still registered but no longer injected anywhere.

- [ ] **Step 5: Checkpoint**

Surface the diff summary to the user. Suggested commit message:

```
refactor(api-mailer): switch Save/Get settings repositories to api-core Encryption
```

Wait for user confirmation before moving to Task 2.

---

## Task 2: Delete local encryption feature, remove `getSecret` short-circuit in GraphQL, purge env-var tests

**Why second:** With Task 1 landed, the local `PasswordEncryption` and its utilities are dead code. Deleting them forces the GraphQL resolver cleanup (which still imports `getSecret`) in the same task, otherwise the build breaks. Tests that set `WEBINY_API_MAILER_PASSWORD_SECRET` get the writes stripped — those env reads no longer exist.

**Files:**
- Delete: `packages/api-mailer/src/domain/Encryption/abstractions.ts`
- Delete: `packages/api-mailer/src/features/Encryption/PasswordEncryption.ts`
- Delete: `packages/api-mailer/src/features/Encryption/feature.ts`
- Delete: `packages/api-mailer/src/features/Encryption/utils/password.ts`
- Delete: `packages/api-mailer/src/features/Encryption/utils/secret.ts`
- Modify: `packages/api-mailer/src/index.ts`
- Modify: `packages/api-mailer/src/graphql/settings.ts`
- Modify: `packages/api-mailer/package.json`
- Modify: `packages/api-mailer/__tests__/settings.crud.test.ts`
- Modify: `packages/api-mailer/__tests__/settings.graphql.test.ts`

### Steps

- [ ] **Step 1: Remove the `EncryptionFeature` registration in `src/index.ts`**

Edit `packages/api-mailer/src/index.ts`. Delete the import line:

```ts
import { EncryptionFeature } from "~/features/Encryption/feature.js";
```

Delete the registration line inside `createMailerContext`:

```ts
EncryptionFeature.register(context.container);
```

The file after editing must read exactly:

```ts
import { createContextPlugin } from "@webiny/api";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { createSettingsGraphQL } from "~/graphql/settings.js";

export { MailerService } from "./domain/MailerService/abstractions.js";
export type { IMailerService, IMailerServiceErrors } from "./domain/MailerService/abstractions.js";

export const createMailerContext = () => {
    return createContextPlugin(context => {
        // Register all features
        DummyTransportFeature.register(context.container);
        SmtpTransportFeature.register(context.container);
        GetSettingsFeature.register(context.container);
        SaveSettingsFeature.register(context.container);
        MailerServiceFeature.register(context.container);
        SendMailFeature.register(context.container);
    });
};

export const createMailerGraphQL = () => {
    return createSettingsGraphQL();
};
```

- [ ] **Step 2: Remove the `getSecret` short-circuit in `graphql/settings.ts`**

Edit `packages/api-mailer/src/graphql/settings.ts`.

Delete the import:

```ts
import { getSecret } from "~/features/Encryption/utils/secret.js";
```

Inside the `MailerQuery.getSettings` resolver, delete these lines:

```ts
// First check of encryption key is set!
// If not, this function will throw an error.
// TODO: refactor this to make more sense.
getSecret();
```

The resolver body after editing must read:

```ts
getSettings: async (_, __, context) => {
    try {
        const getSettings = context.container.resolve(GetSettingsUseCase);
        const result = await getSettings.execute();

        const settings = result.value;

        // Remove password from response
        if (settings?.password) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...settingsWithoutPassword } = settings;
            return new Response(settingsWithoutPassword);
        }
        return new Response(settings);
    } catch (ex) {
        return new ErrorResponse(ex);
    }
}
```

Leave the rest of the file unchanged.

- [ ] **Step 3: Delete the local encryption folders**

Run from repo root:

```bash
rm -rf packages/api-mailer/src/domain/Encryption
rm -rf packages/api-mailer/src/features/Encryption
```

Verify:

```bash
ls packages/api-mailer/src/domain 2>&1
ls packages/api-mailer/src/features 2>&1
```

Expected: `domain/` contains `MailerService`, `MailTransport`, `errors.ts` (no `Encryption`). `features/` contains `DummyTransport`, `GetSettings`, `MailerService`, `SaveSettings`, `SendMail`, `SmtpTransport` (no `Encryption`).

- [ ] **Step 4: Remove `node:crypto` from `adio.ignore.src` in `package.json`**

Edit `packages/api-mailer/package.json`. Change:

```json
"adio": {
    "ignore": {
        "src": [
            "node:crypto"
        ]
    }
}
```

to:

```json
"adio": {
    "ignore": {
        "src": []
    }
}
```

(Empty array rather than removing the full `adio` block — other packages follow the same pattern; keep it consistent and avoid any `yarn adio` config surprises.)

- [ ] **Step 5: Strip env-var writes from `__tests__/settings.crud.test.ts`**

Edit `packages/api-mailer/__tests__/settings.crud.test.ts`.

Delete the `beforeEach` block:

```ts
beforeEach(() => {
    delete process.env["WEBINY_API_MAILER_PASSWORD_SECRET"];
});
```

If, after removal, the `beforeEach` import from `vitest` becomes unused, also drop it from the `import { describe, it, expect, beforeEach, vi } from "vitest";` statement. Resulting import:

```ts
import { describe, it, expect, vi } from "vitest";
```

Delete the already-skipped test (the whole `it.skip("should not be possible to get or save settings without secret", ...)` block including its leading `// TODO: @bruno - the \`catch\` block is no longer triggered` comment).

Delete every remaining line of the form:

```ts
process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";
```

(Six occurrences across the remaining tests after the `beforeEach` is gone — each one is a single line at the top of a test body. Run `grep -n WEBINY_API_MAILER_PASSWORD_SECRET packages/api-mailer/__tests__/settings.crud.test.ts` after editing; expected output: nothing.)

- [ ] **Step 6: Strip env-var writes from `__tests__/settings.graphql.test.ts`**

Edit `packages/api-mailer/__tests__/settings.graphql.test.ts`.

Delete the `beforeEach` block:

```ts
beforeEach(() => {
    process.env.WEBINY_API_MAILER_PASSWORD_SECRET = "really secret secret";
});
```

If the `beforeEach` import from `vitest` becomes unused, drop it. Resulting import:

```ts
import { describe, it, expect, vi } from "vitest";
```

Delete the already-skipped test (the whole `it.skip("should not be possible to get or save settings when no secret is available", ...)` block including its leading `// TODO: @bruno - this test is no longer failing` comment).

Verify no remaining references:

```bash
grep -n WEBINY_API_MAILER packages/api-mailer/__tests__/settings.graphql.test.ts
```

Expected: nothing.

- [ ] **Step 7: Build and test**

Run from repo root:

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds.

```bash
yarn test packages/api-mailer --testPathPattern=settings 2>&1 | tail -50
```

(If the Vitest config doesn't accept `--testPathPattern`, run the full `yarn test packages/api-mailer` — the transporter test still uses env vars for transport config at this point, which is fine because Task 3 has not touched `MailerService` yet.)

Expected: the two settings test files pass. If `yarn test packages/api-mailer` is run as-is, `transporter.crud.test.ts` should also pass — its env-var-based transport config is still honored because `getDefaultSettingsFromEnv()` is unchanged.

- [ ] **Step 8: Checkpoint**

Surface the diff summary to the user. Suggested commit message:

```
refactor(api-mailer): remove local Encryption feature and WEBINY_API_MAILER_PASSWORD_SECRET
```

Wait for user confirmation before moving to Task 3.

---

## Task 3: Remove env-var transport fallback from `MailerService`, rewrite `transporter.crud.test.ts`

**Why third:** Task 2 kept `getDefaultSettingsFromEnv()` alive so `transporter.crud.test.ts::should send an email` could keep working unchanged. Now we remove that fallback and rewrite the single test that depended on it to persist settings via `SaveSettingsUseCase`.

**Files:**
- Delete: `packages/api-mailer/src/features/MailerService/TransportFactory.ts`
- Modify: `packages/api-mailer/src/features/MailerService/MailerService.ts`
- Modify: `packages/api-mailer/__tests__/transporter.crud.test.ts`

### Steps

- [ ] **Step 1: Update `MailerService.ts` to drop the env fallback**

Edit `packages/api-mailer/src/features/MailerService/MailerService.ts`.

Delete the import:

```ts
import { getDefaultSettingsFromEnv } from "./TransportFactory.js";
```

Change the `sendMail` body so that it fails fast when no settings are persisted. The full file after editing must read exactly:

```ts
import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import { MailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";
import type { TransportSettings, TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        const result = await this.getSettingsRepository.get();
        const settings = result.value;

        if (!settings) {
            return Result.fail(new NoSettingsConfiguredError());
        }

        const transport = await this.getTransport(settings);

        if (!transport) {
            return Result.fail(new NoTransportAvailableError());
        }

        try {
            const response = await transport.send(data);

            if (response.error) {
                return Result.fail(new TransportSendError(response.error));
            }

            return Result.ok(response);
        } catch (error) {
            return Result.fail(new TransportSendError(error));
        }
    }

    private async getTransport(
        settings: TransportSettings
    ): Promise<MailTransport.Interface | null> {
        if (this.transportFactories.length === 0) {
            return null;
        }

        const factory = this.transportFactories[this.transportFactories.length - 1];

        return factory.createTransport(settings);
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [GetSettingsRepository, [MailTransportFactory, { multiple: true }]]
});
```

- [ ] **Step 2: Delete `TransportFactory.ts`**

Run from repo root:

```bash
rm packages/api-mailer/src/features/MailerService/TransportFactory.ts
```

- [ ] **Step 3: Rewrite `transporter.crud.test.ts` to persist settings via the use case**

Edit `packages/api-mailer/__tests__/transporter.crud.test.ts`. The full file after editing must read exactly:

```ts
import { describe, it, expect, vi } from "vitest";
import { createContextHandler } from "./contextHandler";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import { TransportSendData } from "~/types";

vi.mock("nodemailer", () => {
    return {
        default: {
            createTransport: () => {
                return {
                    sendMail: async (params: TransportSendData) => {
                        return {
                            envelope: "envelope",
                            messageId: "123",
                            accepted: [params.to],
                            rejected: [],
                            pending: [],
                            response: "ok"
                        };
                    }
                };
            }
        }
    };
});

const to = ["to@dummy-host.webiny"];
const cc = ["cc@dummy-host.webiny"];
const bcc = ["bcc@dummy-host.webiny"];
const from = "from@dummy-host.webiny";
const replyTo = "replyTo@dummy-host.webiny";
const subject = "Some dummy subject";
const text = "Some dummy body";
const html = "<p>Some dummy body</p>";

const persistTransportSettings = async (
    context: Awaited<ReturnType<ReturnType<typeof createContextHandler>["handle"]>>
) => {
    const saveSettings = context.container.resolve(SaveSettingsUseCase);
    const result = await saveSettings.execute({
        host: "dummy-host.webiny",
        user: "user",
        password: "password",
        from,
        replyTo
    });

    if (result.isFail()) {
        throw new Error(
            `Failed to persist mailer settings for test setup: ${result.error.message}`
        );
    }
};

describe("Mailer Transporter CRUD", () => {
    const { handle } = createContextHandler();

    it(`should throw error before sending because of missing "to"`, async () => {
        const context = await handle();

        const params: TransportSendData = {
            to: [""],
            cc,
            bcc,
            from,
            replyTo,
            subject,
            text,
            html
        };

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/SendMail/Validation");
    });

    it(`should throw error before sending because of missing "from"`, async () => {
        const context = await handle();

        const params: TransportSendData = {
            to,
            cc,
            bcc,
            from: "",
            replyTo,
            subject,
            text,
            html
        };

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/SendMail/Validation");
    });

    it(`should throw error before sending because of missing "subject"`, async () => {
        const context = await handle();

        const params: TransportSendData = {
            to,
            cc,
            bcc,
            from,
            replyTo,
            subject: "",
            text,
            html
        };

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/SendMail/Validation");
    });

    it(`should throw error before sending because of missing both "text" and "html"`, async () => {
        const context = await handle();

        const params: TransportSendData = {
            to,
            cc,
            bcc,
            from,
            replyTo,
            subject,
            text: "",
            html: ""
        };

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/SendMail/Validation");
    });

    it("should send an email", async () => {
        const context = await handle();
        await persistTransportSettings(context);

        const params: TransportSendData = {
            to,
            cc,
            bcc,
            from,
            replyTo,
            subject,
            text,
            html
        };

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute(params);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            result: "ok",
            error: null
        });
    });
});
```

Notable differences from the old version:
- `beforeEach` env-var writes removed (the whole hook is gone).
- `beforeEach` import dropped from `vitest`.
- `SaveSettingsUseCase` imported at the top.
- New `persistTransportSettings` helper saves settings before the send test runs.
- The `"should send an email"` test now calls that helper before invoking `SendMailUseCase`.

- [ ] **Step 4: Build and test**

Run from repo root:

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds.

```bash
yarn test packages/api-mailer 2>&1 | tail -50
```

Expected: all tests green. Specifically, `should send an email` should now exercise the real `SaveSettings → GetSettings → MailerService → mocked nodemailer` round-trip.

- [ ] **Step 5: Checkpoint**

Surface the diff summary to the user. Suggested commit message:

```
refactor(api-mailer): drop env-var transport fallback, require persisted settings
```

Wait for user confirmation before moving to Task 4.

---

## Task 4: Remove `WEBINY_API_MAILER_*` env typings

**Why fourth:** No code reads these vars anymore. Deleting the typings prevents future use and surfaces any forgotten reference at build time.

**Files:**
- Modify: `typings/env/index.d.ts`

### Steps

- [ ] **Step 1: Delete the api-mailer block in `typings/env/index.d.ts`**

Edit `typings/env/index.d.ts`. Delete the entire block (lines 65–73 on the current `next` branch — count may drift if the file has been edited in the meantime):

```ts
        /**
         * api-mailer
         */
        WEBINY_API_MAILER_HOST?: string;
        WEBINY_API_MAILER_USER?: string;
        WEBINY_API_MAILER_PASSWORD?: string;
        WEBINY_API_MAILER_REPLY_TO?: string;
        WEBINY_API_MAILER_FROM?: string;
        WEBINY_API_MAILER_PASSWORD_SECRET?: string;
```

Leave every other declaration in the file untouched.

- [ ] **Step 2: Verify nothing still references `WEBINY_API_MAILER_*`**

Run from repo root:

```bash
grep -rn "WEBINY_API_MAILER" packages typings 2>&1 | head -20
```

Expected: no matches. If anything shows up, it's a leftover — fix before continuing.

- [ ] **Step 3: Build the package**

Run from repo root:

```bash
yarn build -p @webiny/api-mailer 2>&1 | tail -30
```

Expected: build succeeds. If TypeScript complains about an unknown env var in some file, track it back and clean up (should not happen given Step 2).

- [ ] **Step 4: Run the full test suite**

```bash
yarn test packages/api-mailer 2>&1 | tail -50
```

Expected: all tests green.

- [ ] **Step 5: Checkpoint**

Surface the diff summary. Suggested commit message:

```
chore(typings): remove WEBINY_API_MAILER_* environment variables
```

Wait for user confirmation before moving to Task 5.

---

## Task 5: Preflight before final commit

**Why last:** The project's `CLAUDE.md` mandates this exact sequence before every commit. Run it once here to catch TS-config drift, dependency declarations, formatting, lint, and workspace dep sync after all the deletions.

### Steps

- [ ] **Step 1: Stage changes**

```bash
git add .
```

- [ ] **Step 2: Ensure yarn.lock is up to date**

```bash
yarn > /dev/null 2>&1
```

- [ ] **Step 3: Regenerate tsconfig files**

```bash
node scripts/generateTsConfigsInPackages.js
```

Expected: completes without error. If new tsconfigs are written, that's fine — stage them.

- [ ] **Step 4: Run adio (dependency declarations check)**

```bash
yarn adio 2>&1 | tail -20
```

Expected: pass. If it flags `@webiny/api-core` as a missing dependency for `api-mailer`, note the current state: `@webiny/api-core` is listed only under `devDependencies` in `packages/api-mailer/package.json`. This was acceptable before because the mailer only imported tokens (treated as a peer). The imports from `@webiny/api-core/features/encryption/index.js` added in Task 1 follow the **same** runtime-token pattern as the existing `EventPublisher`, `IdentityContext`, and `KeyValueStore` imports — no change in dependency status should be required. If `yarn adio` disagrees, follow its suggestion (it's authoritative).

- [ ] **Step 5: Format**

```bash
yarn prettier:fix > /dev/null 2>&1
```

- [ ] **Step 6: Lint**

```bash
y eslint 2>&1 | tail -30
```

Expected: pass. Most likely issues after this refactor are unused imports (e.g., leftover `beforeEach` imports in tests) — fix inline if any are surfaced.

- [ ] **Step 7: Sync workspace dependencies**

```bash
yarn webiny sync-dependencies 2>&1 | tail -20
```

- [ ] **Step 8: Re-stage**

```bash
git add .
```

- [ ] **Step 9: Final checkpoint**

Show the user:
- `git status` output (so they can see what ended up staged).
- A short summary of each task's commit suggestion, re-usable by the user as the final commit message if they squash, for example:

```
refactor(api-mailer): drop local encryption, rely on api-core Encryption + persisted settings

* Swap SaveSettings/GetSettings repositories to @webiny/api-core/features/encryption (sync encrypt/decrypt).
* Delete local Encryption feature, domain, and password-secret env var.
* Remove env-var transport fallback; sendMail now requires persisted settings.
* Remove all WEBINY_API_MAILER_* env typings.
* Tests updated: the transporter send test persists settings via SaveSettingsUseCase.

Operators must re-save their mailer SMTP settings after this upgrade — the previously
stored ciphertext is no longer decryptable with the new (shared) encryption.
```

Wait for the user to commit.

---

## Success criteria (from the spec)

After all tasks land, verify:

- [ ] `packages/api-mailer/src/domain/Encryption/` and `packages/api-mailer/src/features/Encryption/` are gone.
- [ ] `SaveSettingsRepository` and `GetSettingsRepository` depend on `@webiny/api-core/features/encryption` and use synchronous encrypt/decrypt.
- [ ] `MailerService` has no env-var fallback; `sendMail` fails fast with `NoSettingsConfiguredError` when no settings are persisted.
- [ ] `graphql/settings.ts` has no `getSecret` import, no short-circuit, no TODO referencing encryption.
- [ ] No `WEBINY_API_MAILER_*` reference remains in `packages/api-mailer/**` or `typings/env/index.d.ts`.
- [ ] All `__tests__/*.ts` in `packages/api-mailer` pass without setting any `WEBINY_API_MAILER_*` env var.
- [ ] `yarn build -p @webiny/api-mailer` succeeds.
- [ ] `yarn adio` passes.
