import { createContext } from "./createContext";
import { TransportSendData } from "~/types";

const to = ["to@test.com"];
const cc = ["cc@test.com"];
const bcc = ["bcc@test.com"];
const from = "from@test.com";
const replyTo = "replyTo@test.com";
const subject = "Some dummy subject";
const text = "Some dummy body";
const html = "<p>Some dummy body</p>";

describe("Mailer crud", () => {
    beforeEach(() => {
        process.env.WEBINY_MAILER_HOST = "localhost";
        process.env.WEBINY_MAILER_USER = "user";
        process.env.WEBINY_MAILER_PASSWORD = "password";
        process.env.WEBINY_MAILER_REPLY_TO = "replyTo@localhost.com";
        process.env.WEBINY_MAILER_FROM = "from@localhost.com";
    });

    it(`should throw error before sending because of missing "to"`, async () => {
        const context = await createContext();

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
        const context = await createContext();

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
        const context = await createContext();

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
        const context = await createContext();

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
});
