### Task 3b: api-mailer defaults `from` to the configured settings `from`

Spec 12; R201 (user answer Q5, `../00-answers.md`); R87 (unchanged). Today a mail sent without `from` reaches nodemailer without a sender, so the SMTP server rejects it or fills in its own account. The mailer settings (`TransportSettings.from`, saved in the admin or defined in code) already hold the sender, but `SmtpMailTransport.send` forwards only what the caller passed. The workflows e-mail transport (Task 3) sends without `from`, as does every other caller that relies on the configured sender. This task fixes it once, in `packages/api-mailer`, at the one place the SMTP transport is built from the settings.

- **Where:** `SmtpMailTransportFactory.createTransport(settings)` hands `settings.from` to `new SmtpMailTransport(config, settings.from)`; `SmtpMailTransport.send` uses `from || this.defaultFrom || undefined`. The factory is the only place that holds both the settings and the transport, so nothing else changes: `MailerService` (resolves a factory, calls `transport.send(data)`), `SendMailUseCase` (its schema already has `from` optional, only an empty or malformed explicit `from` fails validation; the existing "missing from" test sends `from: ""` and stays red-as-expected), `GetSettingsRepository`, `CodeMailerSettings` and `SmtpConfig` stay as they are.
- **Explicit wins:** a caller `from` (a non-empty string) is used as is. `replyTo` is passed through untouched (no default from the settings `replyTo`).
- **No settings `from`:** `GetSettingsRepository` turns a stored missing `from` into `""` and code settings are typed `from: string`, so an empty default is possible. An empty default is treated as no default: `from` is passed as `undefined`, exactly the behaviour before this task.
- **DummyTransport:** `DummyMailTransport.send()` ignores its input and `DummyMailTransportFactory` has no settings, so it is unaffected and needs no change (it is only used when no SMTP settings exist, where there is no configured `from` to default to).
- **Storage:** `packages/api-mailer` runs vitest on `ddb` and `ddb-os,ddb` (`packages/api-mailer/ci.config.json`, `.github/workflows/wac/utils/v5ListPackagesWithJestTests.ts`); its tests use the context handler with storage ops. It is not an `-es`/`-os` package, but run each test file with `yarn test` and with `yarn test:os` (the `ddb-os,ddb` CI leg). The unit tests in the file below do not touch storage; its two end-to-end tests do, and the file must pass on both `yarn test` and `yarn test:os`.

**Files:**
- Modify: `packages/api-mailer/src/features/SmtpTransport/SmtpMailTransport.ts`
- Modify: `packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts`
- Create: `packages/api-mailer/__tests__/smtpDefaultFrom.test.ts`
- Existing, must stay green unchanged: `packages/api-mailer/__tests__/transporter.crud.test.ts`, `packages/api-mailer/__tests__/settings.codeSource.test.ts`, `packages/api-mailer/__tests__/codeSettings.test.ts`

**Interfaces:**
- Consumes (existing): `MailTransport.Interface` / `MailTransport.SendParams` (`TransportSendData`, `from?: string`), `MailTransportFactory.Interface` (`canUse(settings)`, `createTransport(settings: TransportSettings)`), `TransportSettings.from: string`, `SmtpConfig.fromTransportSettings`.
- Produces: `new SmtpMailTransport(config: SMTPTransport.Options, defaultFrom?: string)`. No public export changes; `MailerService` and `SendMailUseCase` signatures are unchanged. Later tasks (Task 10's real notifier) rely on it by sending without `from`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-mailer/__tests__/smtpDefaultFrom.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { createContextHandler } from "./contextHandler";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";
import type { TransportSendData, TransportSettings } from "~/types";

const nodemailerMock = vi.hoisted(() => {
    return { sendMail: vi.fn() };
});

vi.mock("nodemailer", () => {
    return {
        default: {
            createTransport: () => {
                return { sendMail: nodemailerMock.sendMail };
            }
        }
    };
});

const settings: TransportSettings = {
    host: "code-host.webiny",
    port: 587,
    secure: false,
    user: "code-user",
    password: "code-password",
    from: "settings-from@example.com",
    replyTo: "settings-reply@example.com"
};

const baseMail: TransportSendData = {
    bcc: ["bcc@dummy-host.webiny"],
    subject: "Some dummy subject",
    text: "Some dummy body"
};

describe("SMTP transport default from (R201)", () => {
    beforeEach(() => {
        nodemailerMock.sendMail.mockReset();
        nodemailerMock.sendMail.mockResolvedValue({ messageId: "123", response: "ok" });
    });

    it("uses the default from when the caller passes none", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        const response = await transport.send(baseMail);

        expect(response).toEqual({ result: "ok", error: null });
        expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(1);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("settings-from@example.com");
    });

    it("keeps an explicit from from the caller", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        await transport.send({ ...baseMail, from: "caller@example.com" });

        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("caller@example.com");
    });

    it("leaves replyTo untouched", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        await transport.send(baseMail);
        await transport.send({ ...baseMail, replyTo: "caller-reply@example.com" });

        expect(nodemailerMock.sendMail.mock.calls[0][0].replyTo).toBeUndefined();
        expect(nodemailerMock.sendMail.mock.calls[1][0].replyTo).toBe("caller-reply@example.com");
    });

    it("sends no from when there is no default and the caller passes none (unchanged behaviour)", async () => {
        const withoutDefault = new SmtpMailTransport({});
        const emptyDefault = new SmtpMailTransport({}, "");

        await withoutDefault.send(baseMail);
        await emptyDefault.send(baseMail);

        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBeUndefined();
        expect(nodemailerMock.sendMail.mock.calls[1][0].from).toBeUndefined();
    });

    it("sendMail without from reaches nodemailer with the configured settings from", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(settings)]
        });
        const context = await handle();
        const sendMail = context.container.resolve(SendMailUseCase);

        const result = await sendMail.execute(baseMail);

        expect(result.isOk()).toBe(true);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("settings-from@example.com");
    });

    it("sendMail with an explicit from keeps it end to end", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(settings)]
        });
        const context = await handle();
        const sendMail = context.container.resolve(SendMailUseCase);

        const result = await sendMail.execute({ ...baseMail, from: "caller@example.com" });

        expect(result.isOk()).toBe(true);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("caller@example.com");
    });
});
```

The two end-to-end tests go through `MailerService`, the real factory and the settings, so they prove the factory passes `settings.from`.

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-mailer/__tests__/smtpDefaultFrom.test.ts 2>&1 | tail -50
yarn test:os packages/api-mailer/__tests__/smtpDefaultFrom.test.ts 2>&1 | tail -50
```

Expected: FAIL. The "uses the default from" and the end-to-end "without from" tests receive `from` undefined; the other tests already pass. (The constructor call with a second argument is also a type error; vitest does not type-check.)

- [ ] **Step 3: Implement**

`packages/api-mailer/src/features/SmtpTransport/SmtpMailTransport.ts`, change the constructor and the `from` passed to nodemailer (the rest of the file is unchanged):

```ts
export class SmtpMailTransport implements MailTransport.Interface {
    public readonly name = "Mailer/SmtpTransport";
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor(
        config: SMTPTransport.Options,
        private readonly defaultFrom?: string
    ) {
        this.transporter = nodemailer.createTransport(config);
    }

    async send(params: MailTransport.SendParams) {
        const { replyTo, text, html, to, bcc, cc, from, subject } = params;

        try {
            const result = await this.transporter.sendMail({
                replyTo,
                bcc,
                cc,
                // An explicit sender wins; otherwise the configured settings sender (R201).
                // An empty default counts as none, so a missing settings `from` changes nothing.
                from: from || this.defaultFrom || undefined,
                text,
                html,
                to,
                subject
            });
```

`packages/api-mailer/src/features/SmtpTransport/SmtpMailTransportFactory.ts`, change `createTransport`:

```ts
    async createTransport(settings: TransportSettings): MailTransportFactory.Return {
        return new SmtpMailTransport(SmtpConfig.fromTransportSettings(settings), settings.from);
    }
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/api-mailer/__tests__/smtpDefaultFrom.test.ts 2>&1 | tail -50
yarn test:os packages/api-mailer/__tests__/smtpDefaultFrom.test.ts 2>&1 | tail -50
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-mailer/__tests__/transporter.crud.test.ts 2>&1 | tail -50
yarn test:os packages/api-mailer/__tests__/transporter.crud.test.ts 2>&1 | tail -50
yarn test packages/api-mailer/__tests__/settings.codeSource.test.ts 2>&1 | tail -50
yarn test:os packages/api-mailer/__tests__/settings.codeSource.test.ts 2>&1 | tail -50
yarn test packages/api-mailer/__tests__/codeSettings.test.ts 2>&1 | tail -50
yarn test:os packages/api-mailer/__tests__/codeSettings.test.ts 2>&1 | tail -50
yarn check:test:types -p api-mailer --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors. The "missing from" test (`from: ""`) still fails validation with `Mailer/SendMail/Validation`.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full, building each changed package with `--no-cache`, and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-mailer --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "fix(api-mailer): default the sender to the configured settings from" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
