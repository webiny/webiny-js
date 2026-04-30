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
