import { createContext } from "./createContext";
import { MailerContextObjectSendParams } from "~/types";
import { createDummyMailer, DummyMailer } from "~/mailers/createDummyMailer";

const to = ["to@test.com"];
const cc = ["cc@test.com"];
const bcc = ["bcc@test.com"];
const from = "from@test.com";
const replyTo = "replyTo@test.com";
const subject = "Some dummy subject";
const text = "Some dummy body";
const html = "<p>Some dummy body</p>";

describe("Mailer crud", () => {
    it("should set dummy mailer via factory and send e-mail", async () => {
        const context = await createContext();

        context.mailer.setMailer(async () => {
            return import("~/mailers/createDummyMailer").then(module => {
                return module.createDummyMailer();
            });
        });

        const params: MailerContextObjectSendParams = {
            data: {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text,
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toEqual({
            result: true,
            error: null
        });

        const mailer = await context.mailer.getMailer<DummyMailer>();

        expect(mailer.getAllSent()).toEqual([
            {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text,
                html
            }
        ]);
    });

    it("should send e-mail via dummy mailer", async () => {
        const mailer = createDummyMailer();

        const context = await createContext();

        context.mailer.setMailer(mailer);

        const params: MailerContextObjectSendParams = {
            data: {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text,
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toEqual({
            result: true,
            error: null
        });

        expect(mailer.getAllSent()).toEqual([
            {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text,
                html
            }
        ]);
    });

    it(`should throw error before sending because of missing "to"`, async () => {
        const context = await createContext();

        const params: MailerContextObjectSendParams = {
            data: {
                to: [""],
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text,
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params.data
                }
            }
        });
    });

    it(`should throw error before sending because of missing "from"`, async () => {
        const mailer = createDummyMailer();

        const context = await createContext();

        context.mailer.setMailer(mailer);

        const params: MailerContextObjectSendParams = {
            data: {
                to,
                cc,
                bcc,
                from: "",
                replyTo,
                subject,
                text,
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params.data
                }
            }
        });
    });

    it(`should throw error before sending because of missing "subject"`, async () => {
        const mailer = createDummyMailer();

        const context = await createContext();

        context.mailer.setMailer(mailer);

        const params: MailerContextObjectSendParams = {
            data: {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject: "",
                text,
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params.data
                }
            }
        });
    });

    it(`should throw error before sending because of missing "text"`, async () => {
        const mailer = createDummyMailer();

        const context = await createContext();

        context.mailer.setMailer(mailer);

        const params: MailerContextObjectSendParams = {
            data: {
                to,
                cc,
                bcc,
                from,
                replyTo,
                subject,
                text: "",
                html
            }
        };

        const result = await context.mailer.send(params);

        expect(result).toMatchObject({
            result: null,
            error: {
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    data: params.data
                }
            }
        });
    });
});
