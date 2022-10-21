import { createContextHandler } from "./createContextHandler";
import { TransportSendData } from "~/types";

jest.mock("nodemailer", () => {
    return {
        createTransport: (config: any) => {
            console.log(`Creating test transport with config: ${JSON.stringify(config)}`);
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

describe("Mailer Transporter Operations", () => {
    const { handle } = createContextHandler();

    beforeEach(() => {
        process.env.WEBINY_MAILER_HOST = "dummy-host.webiny";
        process.env.WEBINY_MAILER_USER = "user";
        process.env.WEBINY_MAILER_PASSWORD = "password";
        process.env.WEBINY_MAILER_REPLY_TO = "replyTo@dummy-host.webiny";
        process.env.WEBINY_MAILER_FROM = "from@dummy-host.webiny";
        process.env.WEBINY_MAILER_PASSWORD_SECRET = "really secret secret";
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

        const result = await context.mailer.sendMail(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params
                }
            }
        });
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

        const result = await context.mailer.sendMail(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params
                }
            }
        });
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

        const result = await context.mailer.sendMail(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params
                }
            }
        });
    });

    it(`should throw error before sending because of missing "text"`, async () => {
        const context = await handle();

        const params: TransportSendData = {
            to,
            cc,
            bcc,
            from,
            replyTo,
            subject,
            text: "",
            html
        };

        const result = await context.mailer.sendMail(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params
                }
            }
        });
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

        const result = await context.mailer.sendMail(params);
        expect(result).toEqual({
            result: true,
            error: null
        });
    });
});
