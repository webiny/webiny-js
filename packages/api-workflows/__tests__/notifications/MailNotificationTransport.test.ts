import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import {
    MailAfterSendEventHandler,
    MailBeforeSendEventHandler
} from "@webiny/api-mailer/features/SendMail/index.js";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingMailer, type SentMail } from "~tests/__helpers/RecordingMailer.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { MAIL_BCC_CHUNK_SIZE } from "~/features/notifications/shared/constants.js";

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

const DETAILS: NotificationTransport.MessageDetails = {
    contentType: "Article",
    contentTitle: "Home page",
    stepNumber: 2,
    stepCount: 3,
    stepTitle: "Legal review",
    requester: "Rita Requester"
};

const FULL_MESSAGE: NotificationTransport.Message = {
    ...MESSAGE,
    linkLabel: "View review details",
    footer: "You get this e-mail because you owned this step.",
    details: DETAILS
};

const BUTTON_STYLE =
    "display:inline-block;padding:10px 16px;border-radius:4px;background:#333333;color:#ffffff;text-decoration:none;";

const createTransport = async (
    mailer: RecordingMailer,
    register?: (container: Container) => void
) => {
    loggedErrors.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(MailerService, mailer);
            register?.(container);
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
        const transport = await createTransport(new RecordingMailer());

        expect(transport.id).toBe("e-mail");
        expect(transport.title).toBe("E-mail");
        expect(transport.description).toBe("Sends an e-mail to the people who need to act.");
    });

    it("escapes the html and leaves the text untouched", async () => {
        const mailer = new RecordingMailer();
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
            "<p>Hi,</p><p>Anna &lt;b&gt;&quot;Adams&quot;&lt;/b&gt; &amp; &#39;Cara&#39;<br/>second line &lt;script&gt;</p>"
        );
        expect(mailer.sent[0].text).toBe(
            `Hi,\n\nAnna <b>"Adams"</b> & 'Cara'\nsecond line <script>`
        );
        expect(mailer.sent[0].html).not.toContain("<script>");
    });

    it("collapses CR, LF and whitespace runs in the subject to single spaces", async () => {
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);
        const url = "https://admin.test/cms/content-entries/article?id=a%231&tenantId=root";

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: { ...MESSAGE, url, linkLabel: "Open <content>" }
        });

        expect(mailer.sent[0].html).toBe(
            "<p>Hi,</p><p>Every step approved this revision.</p>" +
                `<p><a href="https://admin.test/cms/content-entries/article?id=a%231&amp;tenantId=root" style="${BUTTON_STYLE}">Open &lt;content&gt;</a></p>`
        );
        expect(mailer.sent[0].text).toBe(`Hi,\n\n${MESSAGE.body}\n\nOpen <content>: ${url}`);
    });

    it("sends no link when the url is null", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE });

        expect(mailer.sent[0].html).toBe("<p>Hi,</p><p>Every step approved this revision.</p>");
        expect(mailer.sent[0].html).not.toContain("<a");
        expect(mailer.sent[0].text).toBe(`Hi,\n\n${MESSAGE.body}`);
    });

    it("renders the greeting, the body, the details table, the button and the footer, in that order", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);
        const url =
            "https://admin.test/website-builder/pages/editor/p%231?tenantId=root&reviewId=r-1";

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: { ...FULL_MESSAGE, url }
        });

        const { html, text } = mailer.sent[0];
        expect(text).toBe(
            [
                "Hi,",
                "Every step approved this revision.",
                [
                    "Content: Article · Home page",
                    "Step: 2 of 3 · Legal review",
                    "Requested by: Rita Requester"
                ].join("\n"),
                `View review details: ${url}`,
                FULL_MESSAGE.footer
            ].join("\n\n")
        );
        const parts = [
            "<p>Hi,</p>",
            "<p>Every step approved this revision.</p>",
            "<table",
            ">Content</td>",
            ">Article · Home page</td>",
            ">Step</td>",
            ">2 of 3 · Legal review</td>",
            ">Requested by</td>",
            ">Rita Requester</td>",
            "</table>",
            `<a href="https://admin.test/website-builder/pages/editor/p%231?tenantId=root&amp;reviewId=r-1" style="${BUTTON_STYLE}">View review details</a>`,
            `>${FULL_MESSAGE.footer}</p>`
        ];
        let position = -1;
        for (const part of parts) {
            const next = html.indexOf(part, position + 1);
            expect(next, part).toBeGreaterThan(position);
            position = next;
        }
    });

    it("shows only the title in the Content row when the content type is unknown", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: { ...FULL_MESSAGE, details: { ...DETAILS, contentType: null } }
        });

        expect(mailer.sent[0].text).toContain("Content: Home page\n");
        expect(mailer.sent[0].html).toContain(">Home page</td>");
        expect(mailer.sent[0].html).not.toContain("·  Home page");
    });

    it("escapes every value of the details and the footer, and keeps the details on one line", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: {
                ...FULL_MESSAGE,
                footer: "Footer <b>&</b>",
                details: {
                    contentType: "<i>Type</i>",
                    contentTitle: "Title\n<script>x</script>",
                    stepNumber: 1,
                    stepCount: 1,
                    stepTitle: `"Step" & 'co'`,
                    requester: "<Rita>"
                }
            }
        });

        const { html, text } = mailer.sent[0];
        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<i>");
        expect(html).toContain(
            ">&lt;i&gt;Type&lt;/i&gt; · Title &lt;script&gt;x&lt;/script&gt;</td>"
        );
        expect(html).toContain(">1 of 1 · &quot;Step&quot; &amp; &#39;co&#39;</td>");
        expect(html).toContain(">&lt;Rita&gt;</td>");
        expect(html).toContain(">Footer &lt;b&gt;&amp;&lt;/b&gt;</p>");
        expect(text).toContain("Content: <i>Type</i> · Title <script>x</script>\n");
        expect(text).toContain("Requested by: <Rita>");
        expect(text.endsWith("Footer <b>&</b>")).toBe(true);
    });

    it("leaves the table out without details and the footer out without a footer", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: toRecipients(createUsers(1)),
            message: { ...FULL_MESSAGE, details: undefined, footer: "  " }
        });

        expect(mailer.sent[0].html).not.toContain("<table");
        expect(mailer.sent[0].text).toBe(`Hi,\n\n${MESSAGE.body}`);
    });

    it("uses bare addresses: a display name with quotes and a newline never reaches a header", async () => {
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({
            users: [{ id: "idp-user", email: "idp|1234", displayName: "Idp User" }],
            message: MESSAGE
        });

        expect(mailer.sent).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("stops after the first chunk and logs nothing when no mail transport is configured", async () => {
        const mailer = new RecordingMailer();
        mailer.configured = false;
        const transport = await createTransport(mailer);

        await expect(
            transport.send({ users: toRecipients(createUsers(120)), message: MESSAGE })
        ).resolves.toBeUndefined();

        // The first chunk finds no transport; the other two are not tried.
        expect(mailer.sent).toHaveLength(1);
        expect(loggedErrors).toEqual([]);
    });

    it("sends 120 recipients as 3 mails of 50, 50 and 20", async () => {
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
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
        const mailer = new RecordingMailer();
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
        class ObjectCodeMailer extends RecordingMailer {
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

    it("logs a mailer validation failure once with the fixed text and its code, and never throws", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        // A one character subject is below the mailer schema's minimum of 2.
        await expect(
            transport.send({
                users: toRecipients(createUsers(1)),
                message: { ...MESSAGE, title: "A" }
            })
        ).resolves.toBeUndefined();

        expect(mailer.sent).toEqual([]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not send a workflow notification e-mail.");
        expect(loggedErrors[0].fields).toEqual({
            errorCode: "Mailer/SendMail/Validation",
            errorName: "Error",
            userIds: ["user-0"]
        });
    });

    it("fires the mail events: an after-send handler sees the workflow mail", async () => {
        const seen: string[] = [];
        class RecordingAfterSend implements MailAfterSendEventHandler.Interface {
            public async handle(event: MailAfterSendEventHandler.Event) {
                seen.push(event.payload.data.subject);
            }
        }
        const handler = MailAfterSendEventHandler.createImplementation({
            implementation: RecordingAfterSend,
            dependencies: []
        });
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer, container => {
            container.register(handler);
        });

        await transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE });

        expect(mailer.sent).toHaveLength(1);
        expect(seen).toEqual([MESSAGE.title]);
    });

    it("logs a throwing event handler once and never throws", async () => {
        class ThrowingAfterSend implements MailAfterSendEventHandler.Interface {
            public async handle(): Promise<void> {
                throw Object.assign(new Error("handler for anna@webiny.test failed"), {
                    code: "HANDLER_FAILED"
                });
            }
        }
        const handler = MailAfterSendEventHandler.createImplementation({
            implementation: ThrowingAfterSend,
            dependencies: []
        });
        const transport = await createTransport(new RecordingMailer(), container => {
            container.register(handler);
        });

        await expect(
            transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields.errorCode).toBe("HANDLER_FAILED");
        expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
    });

    it("logs a throwing before-send handler once, never throws and sends no mail", async () => {
        class ThrowingBeforeSend implements MailBeforeSendEventHandler.Interface {
            public async handle(): Promise<void> {
                throw Object.assign(new Error("handler for anna@webiny.test failed"), {
                    code: "BEFORE_FAILED"
                });
            }
        }
        const handler = MailBeforeSendEventHandler.createImplementation({
            implementation: ThrowingBeforeSend,
            dependencies: []
        });
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer, container => {
            container.register(handler);
        });

        await expect(
            transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE })
        ).resolves.toBeUndefined();

        expect(mailer.sent).toEqual([]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not send a workflow notification e-mail.");
        expect(loggedErrors[0].fields.errorCode).toBe("BEFORE_FAILED");
        expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
    });

    it("does not use console.error", async () => {
        const mailer = new RecordingMailer();
        mailer.failOn = [0];
        mailer.throwOn = [1];
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(120)), message: MESSAGE });

        expect(loggedErrors).toHaveLength(2);
        expect(consoleError).not.toHaveBeenCalled();
    });
});
