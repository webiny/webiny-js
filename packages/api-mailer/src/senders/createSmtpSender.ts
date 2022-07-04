/**
 * Nodemailer docs
 * https://nodemailer.com/about/
 */
import { MailerSender } from "~/types";
import WebinyError from "@webiny/error";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport, { Options } from "nodemailer/lib/smtp-transport";
import { createDummySender, DummySender } from "~/senders/createDummySender";

export type SmtpSenderConfig = Options;
export interface SmtpSender extends MailerSender {
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
}

interface SmtpSenderVariables {
    host?: string;
    user?: string;
    password?: string;
}
const variables: SmtpSenderVariables = {
    host: process.env.WEBINY_MAILER_HOST,
    user: process.env.WEBINY_MAILER_USER,
    password: process.env.WEBINY_MAILER_PASSWORD
};

export const createSmtpSender = (config?: SmtpSenderConfig): SmtpSender | DummySender => {
    const host = variables.host;
    const user = variables.user;
    const pass = variables.password;

    if (!host) {
        console.log(
            "There is no WEBINY_MAILER_HOST environment variable defined. Using dummy sender."
        );
        return createDummySender();
    } else if (!user) {
        console.log(
            "There is no WEBINY_MAILER_USER environment variable defined. Using dummy sender."
        );
        return createDummySender();
    } else if (!pass) {
        console.log(
            "There is no WEBINY_MAILER_PASSWORD environment variable defined. Using dummy sender."
        );
        return createDummySender();
    }
    const transporter = nodemailer.createTransport({
        ...(config || {}),
        host,
        auth: {
            user,
            pass
        }
    });

    return {
        transporter,
        send: async params => {
            const { replyTo, text, html, to, bcc, cc, from, subject } = params;

            try {
                const result = await transporter.sendMail({
                    replyTo,
                    bcc,
                    cc,
                    from,
                    text,
                    html,
                    to,
                    subject
                });
                if (result.messageId) {
                    return {
                        result: true,
                        error: null
                    };
                }

                throw new WebinyError({
                    message:
                        "nodemailer.sendMail does not have a messageId in the result. Something went wrong...",
                    code: "MAILER_ERROR",
                    data: {
                        ...result
                    }
                });
            } catch (ex) {
                return {
                    result: null,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: {
                            ...params,
                            ...ex.data
                        }
                    }
                };
            }
        }
    };
};
