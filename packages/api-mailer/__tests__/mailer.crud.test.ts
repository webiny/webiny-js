import { createContext } from "./createContext";
import { MailerContextObjectSendParams } from "~/types";
import { createDummySender, DummySender } from "~/senders/createDummySender";

const to = ["to@test.com"];
const cc = ["cc@test.com"];
const bcc = ["bcc@test.com"];
const from = "from@test.com";
const replyTo = "replyTo@test.com";
const subject = "Some dummy subject";
const text = "Some dummy body";
const html = "<p>Some dummy body</p>";

describe("Mailer crud", () => {
    it("should set dummy sender via factory and send e-mail", async () => {
        const context = await createContext();

        context.mailer.setSender(async () => {
            return import("~/senders/createDummySender").then(module => {
                return module.createDummySender();
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

        const sender = await context.mailer.getSender<DummySender>();

        expect(sender.getAllSent()).toEqual([
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

    it("should send e-mail via dummy sender", async () => {
        const sender = createDummySender();

        const context = await createContext();

        context.mailer.setSender(sender);

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

        expect(sender.getAllSent()).toEqual([
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
        const sender = createDummySender();

        const context = await createContext();

        context.mailer.setSender(sender);

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
        const sender = createDummySender();

        const context = await createContext();

        context.mailer.setSender(sender);

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
        const sender = createDummySender();

        const context = await createContext();

        context.mailer.setSender(sender);

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
