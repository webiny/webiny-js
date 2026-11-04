### Task 3: E-mail transport: escaping, `Logger`, link, bare addresses

Spec 12; D103, D129; R87, R146 (mirror), R190, R193, R196; Review Focus 4 (no raw error text) and 6 (escaping, header injection, bcc chunking, link from the URL parameter only); A62. The scaffold's `MailNotificationTransport` puts message text into HTML unescaped, quotes display names into `bcc` (header injection and names leaked to other recipients), logs with `console.error` and puts the whole mailer error in the log. This task fixes all of it. Nothing calls the transport yet (Task 10's notifier does); the transport is tested alone through the real container with a fake mailer.

- `MailNotificationTransport` keeps id `"e-mail"` and title `"E-Mail"` and adds `description = "Sends an e-mail to the people who need to act."`. Dependencies `[MailerService, Logger]`.
- **Escaping:** every interpolated string in the HTML is escaped with the pure `escapeHtml` (`& < > " '` become `&amp; &lt; &gt; &quot; &#39;`, `&` first); then `\n` becomes `<br/>` in the body paragraph. The plain `text` is the message body untouched.
- **Link:** when `message.url` is not `null`, `html` gets a second paragraph `<p><a href="{escaped url}">{escaped linkLabel}</a></p>` and `text` becomes `{body}\n\n{linkLabel}: {url}` (raw, plain text). The link comes only from the `url` parameter, never from the body. When `url` is `null` there is no link and `text` is the body.
- **Subject:** `toSingleLine(message.title)` (pure): every CR, LF and run of whitespace becomes one space, then trimmed. The title carries user content (content title, step title), so a newline in it must not become a header (header injection).
- **Addresses:** `bcc` holds bare `user.email` values only (never `"Name" <address>`: no quoting, no header injection through a display name, no names shown to other recipients). An address is kept only if it has exactly one `@` with text on both sides and contains no whitespace, comma, semicolon or angle bracket (an external IdP user can have its identity id as `email`); the rest are skipped. Addresses are deduplicated within one send (first occurrence wins). No usable address means no mail. This filter lives only here (`NotificationRecipientService.listUsers` returns users as stored, R194).
- **Chunks:** one mail per `MAIL_BCC_CHUNK_SIZE = 50` recipients (`domain/notifications/constants.ts`): `sendMail({ bcc, subject, text, html })` once per chunk of at most 50 addresses, no `to`. 120 recipients are 3 mails of 50, 50 and 20.
- **Failures (R87, R190, R196):** the call is in a try/catch and a failed Result is checked. Each failed chunk logs once, `Logger.error({ errorCode, errorName, userIds }, "Could not send a workflow notification e-mail.")`, where `userIds` are the ids of that chunk's users. Never `error.message` (an SMTP error can hold addresses), never the error object, never an address, never the subject. The next chunk still goes out. `send` never throws and never uses `console.error`.
- `errorName` is the error's `name`; a `BaseError` subclass reports `"Error"` (R193 unchanged). For a thrown value, `errorCode` and `errorName` are logged only when they are strings, else `undefined`.
- Task 2's and Task 1's tests that assert the e-mail row's `description` are updated here (it was `null` until now).

**Files:**
- Create: `packages/api-workflows/src/domain/notifications/escapeHtml.ts`
- Create: `packages/api-workflows/src/domain/notifications/toSingleLine.ts`
- Create: `packages/api-workflows/src/domain/notifications/constants.ts`
- Modify: `packages/api-workflows/src/features/notifications/NotificationTransport/MailNotificationTransport.ts`
- Create: `packages/api-workflows/__tests__/notifications/escapeHtml.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/toSingleLine.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `NotificationTransport` and its namespace `Interface`, `SendParams`, `User`, `Message` (`~/features/notifications/NotificationTransport/index.js`); `message: { title; body; url: string | null; linkLabel }`.
  - Existing: `MailerService` (`@webiny/api-mailer`; `sendMail<T>(data): Promise<Result<TransportSendResponse<T>, MailerServiceError>>`, `TransportSendData`: `bcc: string[]` with no `to`, `subject`, `text`, `html`), `Logger` (`@webiny/api-core/features/logger/index.js`).
  - Existing test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`). A test overrides a built-in with `container.registerInstance(MailerService, fake)` (`@webiny/di` resolves `registerInstance` before class registrations). Task 10 later adds a shared `RecordingMailer` helper and replaces the local fake below.
- Produces (matches the contract):
  - `escapeHtml(value: string): string` (`~/domain/notifications/escapeHtml.js`) and `toSingleLine(value: string): string` (`~/domain/notifications/toSingleLine.js`), both pure.
  - `MAIL_BCC_CHUNK_SIZE = 50` (`~/domain/notifications/constants.ts`; Task 6 adds the other constants to this file).
  - The final `MailNotificationTransport` (registered by `NotificationTransportFeature`; Task 10 uses it with the real notifier).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/notifications/escapeHtml.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { escapeHtml } from "~/domain/notifications/escapeHtml.js";

describe("escapeHtml (R193)", () => {
    it("escapes ampersand, angle brackets and both quotes", () => {
        expect(escapeHtml(`a & b < c > d " e ' f`)).toBe(
            "a &amp; b &lt; c &gt; d &quot; e &#39; f"
        );
    });

    it("escapes the ampersand first, so an entity is not left half-escaped", () => {
        expect(escapeHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
    });

    it("neutralises a script tag", () => {
        expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
            "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
        );
    });

    it("keeps newlines and plain text as they are", () => {
        expect(escapeHtml("one\ntwo")).toBe("one\ntwo");
        expect(escapeHtml("")).toBe("");
    });
});
```

Create `packages/api-workflows/__tests__/notifications/toSingleLine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";

describe("toSingleLine (R193)", () => {
    it("turns CR, LF and CRLF into single spaces", () => {
        expect(toSingleLine("Rejected: A\r\nBcc: evil@webiny.test")).toBe(
            "Rejected: A Bcc: evil@webiny.test"
        );
        expect(toSingleLine("a\nb\rc")).toBe("a b c");
    });

    it("collapses runs of whitespace and trims", () => {
        expect(toSingleLine("  Review   of \t\t the \n\n page  ")).toBe("Review of the page");
    });

    it("leaves a one-line text unchanged", () => {
        expect(toSingleLine("Approved: Home page")).toBe("Approved: Home page");
        expect(toSingleLine("")).toBe("");
    });
});
```

Create `packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { BaseError, Result } from "@webiny/feature/api";
import { MailerService } from "@webiny/api-mailer";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { MAIL_BCC_CHUNK_SIZE } from "~/domain/notifications/constants.js";

type SentMail = Parameters<MailerService.Interface["sendMail"]>[0];

class SmtpFailure extends BaseError {
    override readonly code = "Mailer/MailerService/TransportSendError" as const;

    public constructor(message: string) {
        super({ message });
    }
}

/** Local fake: records every mail; `failOn` returns a failed Result, `throwOn` throws, by call index. */
class FakeMailer implements MailerService.Interface {
    public readonly sent: SentMail[] = [];
    public failOn: number[] = [];
    public throwOn: number[] = [];
    public failureMessage = "SMTP refused.";

    public async sendMail<T = any>(data: SentMail): MailerService.Return<T> {
        const index = this.sent.length;
        this.sent.push(data);
        if (this.throwOn.includes(index)) {
            throw Object.assign(new Error(this.failureMessage), { code: "ECONNRESET" });
        }
        if (this.failOn.includes(index)) {
            return Result.fail(new SmtpFailure(this.failureMessage) as never);
        }
        return Result.ok({ result: null, error: null });
    }
}

const createUsers = (count: number, from = 0): NotificationTransport.User[] => {
    return Array.from({ length: count }, (_, index) => {
        const id = `user-${from + index}`;
        return { id, email: `${id}@webiny.test`, displayName: `User ${from + index}` };
    });
};

const toRecipients = (users: NotificationTransport.User[]) => {
    return users as NotificationTransport.SendParams["users"];
};

const MESSAGE: NotificationTransport.Message = {
    title: "Approved: Home page",
    body: "Every step approved this revision.",
    url: null,
    linkLabel: "Open content"
};

const createTransport = async (mailer: FakeMailer) => {
    loggedErrors.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(MailerService, mailer);
        }
    });
    const transport = context.container
        .resolveAll(NotificationTransport)
        .find(item => item.id === "e-mail");
    if (!transport) {
        throw new Error("The e-mail transport is not registered.");
    }
    return transport;
};

describe("MailNotificationTransport (R193)", () => {
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
        consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it("keeps its id and title and states a description", async () => {
        const transport = await createTransport(new FakeMailer());

        expect(transport.id).toBe("e-mail");
        expect(transport.title).toBe("E-Mail");
        expect(transport.description).toBe("Sends an e-mail to the people who need to act.");
    });

    it("escapes the html and leaves the text untouched", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: {
                title: `<script>alert("x")</script> & co`,
                body: `Anna <b>"Adams"</b> & 'Cara'\nsecond line <script>`,
                url: null,
                linkLabel: "Open content"
            }
        });

        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].html).toBe(
            "<p>Anna &lt;b&gt;&quot;Adams&quot;&lt;/b&gt; &amp; &#39;Cara&#39;<br/>second line &lt;script&gt;</p>"
        );
        expect(mailer.sent[0].text).toBe(`Anna <b>"Adams"</b> & 'Cara'\nsecond line <script>`);
        expect(mailer.sent[0].html).not.toContain("<script>");
    });

    it("collapses CR, LF and whitespace runs in the subject to single spaces", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: {
                ...MESSAGE,
                title: "Rejected: A\r\nBcc: evil@webiny.test   (Step\t1)\n"
            }
        });

        expect(mailer.sent[0].subject).toBe("Rejected: A Bcc: evil@webiny.test (Step 1)");
        expect(mailer.sent[0].subject).not.toMatch(/[\r\n]/);
    });

    it("adds the link to the html and the text when there is a url", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);
        const url = "https://admin.test/cms/content-entries/article?id=a%231&tenantId=root";

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: { ...MESSAGE, url, linkLabel: "Open <content>" }
        });

        expect(mailer.sent[0].html).toBe(
            "<p>Every step approved this revision.</p>" +
                `<p><a href="https://admin.test/cms/content-entries/article?id=a%231&amp;tenantId=root">Open &lt;content&gt;</a></p>`
        );
        expect(mailer.sent[0].text).toBe(`${MESSAGE.body}\n\nOpen <content>: ${url}`);
    });

    it("sends no link when the url is null", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE });

        expect(mailer.sent[0].html).toBe("<p>Every step approved this revision.</p>");
        expect(mailer.sent[0].html).not.toContain("<a");
        expect(mailer.sent[0].text).toBe(MESSAGE.body);
    });

    it("uses bare addresses: a display name with quotes and a newline never reaches a header", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: [
                {
                    id: "user-eve",
                    email: "eve@webiny.test",
                    displayName: `Eve "Evil"\r\nBcc: victim@webiny.test`
                },
                { id: "user-anna", email: "anna@webiny.test", displayName: "Anna Adams" }
            ],
            message: MESSAGE
        });

        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["eve@webiny.test", "anna@webiny.test"]);
        expect("to" in mailer.sent[0]).toBe(false);
        for (const address of mailer.sent[0].bcc ?? []) {
            expect(address).not.toMatch(/["<>\r\n]/);
        }
    });

    it("skips a user whose email is not a plain address", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);
        const invalid = [
            "idp|1234",
            "@webiny.test",
            "anna@",
            "a@b@webiny.test",
            "an na@webiny.test",
            "anna@webiny.test, eve@webiny.test",
            "anna@webiny.test;eve@webiny.test",
            "<anna@webiny.test>",
            "anna\r\n@webiny.test"
        ];

        await transport.send({
            users: toRecipients([
                ...invalid.map((email, index) => ({
                    id: `invalid-${index}`,
                    email,
                    displayName: "Invalid"
                })),
                { id: "user-anna", email: "anna@webiny.test", displayName: "Anna Adams" }
            ]),
            message: MESSAGE
        });

        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["anna@webiny.test"]);
    });

    it("sends an address once when several users share it", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: [
                { id: "user-1", email: "anna@webiny.test", displayName: "Anna" },
                { id: "user-2", email: "anna@webiny.test", displayName: "Anna again" },
                { id: "user-3", email: "cara@webiny.test", displayName: "Cara" }
            ],
            message: MESSAGE
        });

        expect(mailer.sent[0].bcc).toEqual(["anna@webiny.test", "cara@webiny.test"]);
    });

    it("sends nothing when every email is skipped", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: [{ id: "idp-user", email: "idp|1234", displayName: "Idp User" }],
            message: MESSAGE
        });

        expect(mailer.sent).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("sends 120 recipients as 3 mails of 50, 50 and 20", async () => {
        const mailer = new FakeMailer();
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(120)), message: MESSAGE });

        expect(MAIL_BCC_CHUNK_SIZE).toBe(50);
        expect(mailer.sent.map(mail => mail.bcc?.length)).toEqual([50, 50, 20]);
        expect(mailer.sent.flatMap(mail => mail.bcc ?? [])).toEqual(
            createUsers(120).map(user => user.email)
        );
        for (const mail of mailer.sent) {
            expect(mail.subject).toBe(MESSAGE.title);
            expect("to" in mail).toBe(false);
        }
        expect(loggedErrors).toEqual([]);
    });

    it("logs each failed chunk once and still sends the others", async () => {
        const mailer = new FakeMailer();
        mailer.failOn = [0, 2];
        const transport = await createTransport(mailer);

        await expect(
            transport.send({ users: toRecipients(createUsers(120)), message: MESSAGE })
        ).resolves.toBeUndefined();

        expect(mailer.sent.map(mail => mail.bcc?.length)).toEqual([50, 50, 20]);
        expect(loggedErrors).toHaveLength(2);
        expect(loggedErrors[0].message).toBe("Could not send a workflow notification e-mail.");
        expect(loggedErrors[0].fields).toEqual({
            errorCode: "Mailer/MailerService/TransportSendError",
            errorName: "Error",
            userIds: createUsers(50).map(user => user.id)
        });
        expect(loggedErrors[1].fields.userIds).toEqual(createUsers(20, 100).map(user => user.id));
    });

    it("logs a failed Result once, holding only the error code and name, never an address", async () => {
        const mailer = new FakeMailer();
        mailer.failOn = [0];
        mailer.failureMessage = "Mailbox anna@webiny.test rejected the message.";
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE });

        expect(loggedErrors).toHaveLength(1);
        expect(Object.keys(loggedErrors[0].fields).sort()).toEqual([
            "errorCode",
            "errorName",
            "userIds"
        ]);
        const logged = JSON.stringify(loggedErrors);
        expect(logged).not.toContain("anna@webiny.test");
        expect(logged).not.toContain("user-0@webiny.test");
        expect(logged).not.toContain("rejected the message");
        expect(logged).not.toContain(MESSAGE.title);
    });

    it("logs a throwing mailer once, never rethrows and never logs the error text", async () => {
        const mailer = new FakeMailer();
        mailer.throwOn = [0];
        mailer.failureMessage = "Connection to smtp for anna@webiny.test was reset.";
        const transport = await createTransport(mailer);

        await expect(
            transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields).toEqual({
            errorCode: "ECONNRESET",
            errorName: "Error",
            userIds: ["user-0"]
        });
        expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
    });

    it("logs a thrown value's code and name only when they are strings", async () => {
        class ObjectCodeMailer extends FakeMailer {
            public override async sendMail<T = any>(data: SentMail): MailerService.Return<T> {
                this.sent.push(data);
                throw { code: { address: "anna@webiny.test" }, name: ["anna@webiny.test"] };
            }
        }
        const mailer = new ObjectCodeMailer();
        const transport = await createTransport(mailer);

        await expect(
            transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields).toEqual({
            errorCode: undefined,
            errorName: undefined,
            userIds: ["user-0"]
        });
        expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
    });

    it("does not use console.error", async () => {
        const mailer = new FakeMailer();
        mailer.failOn = [0];
        mailer.throwOn = [1];
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(120)), message: MESSAGE });

        expect(loggedErrors).toHaveLength(2);
        expect(consoleError).not.toHaveBeenCalled();
    });
});
```

Update the three existing e-mail expectations that asserted `description: null`:

In `packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts`, test "lists the registered transports for a user with reassign only":

```ts
        expect(result.value).toContainEqual({
            id: "e-mail",
            title: expect.any(String),
            description: "Sends an e-mail to the people who need to act."
        });
```

In `packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts`, test "lists the built-in e-mail transport for an editor":

```ts
        expect(rows).toEqual([
            {
                id: "e-mail",
                title: "E-Mail",
                description: "Sends an e-mail to the people who need to act."
            }
        ]);
```

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`, test "lists the notification transports for an editor with an optional description" (drop the "Task 3" comment):

```ts
            data: [
                {
                    id: "e-mail",
                    title: "E-Mail",
                    description: "Sends an e-mail to the people who need to act."
                },
                { id: "plain", title: "Plain", description: null }
            ],
```

- [ ] **Step 2: Run the tests and record the failure**

```bash
yarn test packages/api-workflows/__tests__/notifications/escapeHtml.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/notifications/toSingleLine.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50
```

Expected: the first three FAIL on the missing modules (`escapeHtml.js`, `toSingleLine.js`, `constants.js`); once those exist, the mail test would still fail on the missing description, the unescaped html, the quoted `bcc`, the missing chunking and the `console.error` call.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/domain/notifications/escapeHtml.ts`:

```ts
/**
 * Escapes the five characters that matter in HTML text and attribute values (R193). The
 * ampersand goes first so the other replacements are not escaped twice. Pure.
 */
export const escapeHtml = (value: string): string => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};
```

Create `packages/api-workflows/src/domain/notifications/toSingleLine.ts`:

```ts
/**
 * Collapses every CR, LF and run of whitespace to one space and trims (R193). The mail subject
 * holds user content (content and step titles), so a line break in it must not become a header.
 * Pure.
 */
export const toSingleLine = (value: string): string => {
    return value.replace(/\s+/g, " ").trim();
};
```

Create `packages/api-workflows/src/domain/notifications/constants.ts` (Task 6 adds the other constants):

```ts
/** The most recipients in one e-mail's `bcc` (R193). */
export const MAIL_BCC_CHUNK_SIZE = 50;
```

Replace `packages/api-workflows/src/features/notifications/NotificationTransport/MailNotificationTransport.ts`:

```ts
import { MailerService } from "@webiny/api-mailer";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { MAIL_BCC_CHUNK_SIZE } from "~/domain/notifications/constants.js";
import { escapeHtml } from "~/domain/notifications/escapeHtml.js";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";
import { NotificationTransport } from "./abstractions.js";

/** Exactly one "@" with text on both sides; no whitespace, comma, semicolon or angle bracket. */
const PLAIN_ADDRESS = /^[^@\s,;<>]+@[^@\s,;<>]+$/;

const SEND_FAILURE_LOG = "Could not send a workflow notification e-mail.";

/** The two fields read off a thrown value; anything else about it is never logged (R193). */
interface ThrownErrorFields {
    code?: unknown;
    name?: unknown;
}

class MailNotificationTransportImpl implements NotificationTransport.Interface {
    public readonly id = "e-mail";
    public readonly title = "E-Mail";
    public readonly description = "Sends an e-mail to the people who need to act.";

    public constructor(
        private mailer: MailerService.Interface,
        private logger: Logger.Interface
    ) {}

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        const { users, message } = params;

        // An external IdP user can have its identity id as `email`; only plain addresses get
        // mail: exactly one "@" with text on both sides, no whitespace, comma, semicolon or angle
        // bracket. An address used by several users is sent once.
        const seen = new Set<string>();
        const recipients = users.filter(user => {
            if (typeof user.email !== "string" || !PLAIN_ADDRESS.test(user.email)) {
                return false;
            }
            if (seen.has(user.email)) {
                return false;
            }
            seen.add(user.email);
            return true;
        });
        if (recipients.length === 0) {
            return;
        }

        const subject = toSingleLine(message.title);
        let text = message.body;
        let html = `<p>${escapeHtml(message.body).replace(/\n/g, "<br/>")}</p>`;
        if (message.url !== null) {
            text = `${message.body}\n\n${message.linkLabel}: ${message.url}`;
            html += `<p><a href="${escapeHtml(message.url)}">${escapeHtml(message.linkLabel)}</a></p>`;
        }

        for (let start = 0; start < recipients.length; start += MAIL_BCC_CHUNK_SIZE) {
            const chunk = recipients.slice(start, start + MAIL_BCC_CHUNK_SIZE);
            // Bare addresses only: no display name, so no quoting or header injection (R193).
            const bcc = chunk.map(user => user.email);
            const userIds = chunk.map(user => user.id);
            try {
                const result = await this.mailer.sendMail({ bcc, subject, text, html });
                if (result.isFail()) {
                    this.logger.error(
                        {
                            errorCode: result.error.code,
                            errorName: result.error.name,
                            userIds
                        },
                        SEND_FAILURE_LOG
                    );
                }
            } catch (error) {
                const thrown = error as ThrownErrorFields | null | undefined;
                this.logger.error(
                    {
                        errorCode: typeof thrown?.code === "string" ? thrown.code : undefined,
                        errorName: typeof thrown?.name === "string" ? thrown.name : undefined,
                        userIds
                    },
                    SEND_FAILURE_LOG
                );
            }
        }
    }
}

export const MailNotificationTransport = NotificationTransport.createImplementation({
    implementation: MailNotificationTransportImpl,
    dependencies: [MailerService, Logger]
});
```

(`userIds` is computed once per chunk; the loop and the two log calls are inline, not wrapped in a helper.)

- [ ] **Step 4: Run the tests and see them pass**

```bash
yarn test packages/api-workflows/__tests__/notifications/escapeHtml.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/notifications/toSingleLine.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50
```

Expected: PASS (4 + 3 + 15 tests; the mail test on both storages).

- [ ] **Step 5: Run the existing tests covering the changed code**

The e-mail row's description is asserted in three earlier tests, and the registration test builds the transport with the real `Logger`:

```bash
yarn test packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/config/ListWorkflowNotificationTransports.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
grep -rn "console.error" packages/api-workflows/src/features/notifications || echo "no console.error"
```

Expected: all PASS, no type errors, `no console.error` printed.

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
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "fix(api-workflows): escape html, log through Logger, add the link and use bare addresses in the e-mail transport" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
