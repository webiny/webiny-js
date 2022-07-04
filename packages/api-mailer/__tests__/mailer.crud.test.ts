import { createContext } from "./createContext";
import { MailerContextObjectSendParams } from "~/types";
import { createDummySender } from "~/senders/createDummySender";
import WebinyError from "@webiny/error";

const singleTo = "to@localhost";
const from = "from@localhost";
const subject = "Some dummy subject";
const text = "Some dummy body";
const html = "<p>Some dummy body</p>";

describe("Mailer crud", () => {
    it("should send e-mail via dummy built-in sender", async () => {
        const sender = createDummySender();

        const context = await createContext({
            sender
        });

        const params: MailerContextObjectSendParams = {
            data: {
                to: singleTo,
                from,
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
                to: singleTo,
                from,
                subject,
                text,
                html
            }
        ]);
    });

    it("should throw error before sending", async () => {
        const sender = createDummySender();

        const context = await createContext({
            sender
        });

        const params: MailerContextObjectSendParams = {
            data: {
                to: singleTo,
                from,
                subject,
                text,
                html
            }
        };

        context.mailer.onBeforeSend.subscribe(async () => {
            throw new WebinyError({
                message: "Could not verify mail.",
                code: "MAIL_VERIFICATION_ERROR",
                data: {
                    ...params
                }
            });
        });

        const result = await context.mailer.send(params);

        expect(result).toEqual({
            result: null,
            error: {
                message: "Could not verify mail.",
                code: "MAIL_VERIFICATION_ERROR",
                data: {
                    data: params.data
                }
            }
        });
    });
});
