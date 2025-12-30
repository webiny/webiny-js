import { describe, it, expect, beforeEach, vi } from "vitest";
import { createContextHandler } from "./contextHandler";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
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

describe("Mailer Transporter CRUD", () => {
    const { handle } = createContextHandler();

    beforeEach(() => {
        process.env.WBY_MAILER_PASSWORD_SECRET = "really secret secret";
        process.env.WBY_MAILER_HOST = "dummy-host.webiny";
        process.env.WBY_MAILER_USER = "user";
        process.env.WBY_MAILER_PASSWORD = "password";
        process.env.WBY_MAILER_REPLY_TO = "replyTo@dummy-host.webiny";
        process.env.WBY_MAILER_FROM = "from@dummy-host.webiny";
    });

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
