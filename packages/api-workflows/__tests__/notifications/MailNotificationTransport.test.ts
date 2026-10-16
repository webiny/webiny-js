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
import { MAIL_BCC_CHUNK_SIZE } from "~/domain/notifications/constants.js";

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
        expect(transport.title).toBe("E-Mail");
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
            "<p>Anna &lt;b&gt;&quot;Adams&quot;&lt;/b&gt; &amp; &#39;Cara&#39;<br/>second line &lt;script&gt;</p>"
        );
        expect(mailer.sent[0].text).toBe(`Anna <b>"Adams"</b> & 'Cara'\nsecond line <script>`);
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
            "<p>Every step approved this revision.</p>" +
                `<p><a href="https://admin.test/cms/content-entries/article?id=a%231&amp;tenantId=root">Open &lt;content&gt;</a></p>`
        );
        expect(mailer.sent[0].text).toBe(`${MESSAGE.body}\n\nOpen <content>: ${url}`);
    });

    it("sends no link when the url is null", async () => {
        const mailer = new RecordingMailer();
        const transport = await createTransport(mailer);

        await transport.send({ users: toRecipients(createUsers(1)), message: MESSAGE });

        expect(mailer.sent[0].html).toBe("<p>Every step approved this revision.</p>");
        expect(mailer.sent[0].html).not.toContain("<a");
        expect(mailer.sent[0].text).toBe(MESSAGE.body);
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
