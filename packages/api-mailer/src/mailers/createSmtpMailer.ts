/**
 * Nodemailer docs
 * https://nodemailer.com/about/
 */
import { Mailer } from "~/types";
import WebinyError from "@webiny/error";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport, { Options } from "nodemailer/lib/smtp-transport";
import { createDummyMailer, DummyMailer } from "~/mailers/createDummyMailer";

export type SmtpMailerConfig = Options;

export interface SmtpMailer extends Mailer {
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
}

interface SmtpMailerEnvironmentVariables {
    host?: string;
    user?: string;
    password?: string;
}
const variables: SmtpMailerEnvironmentVariables = {
    host: process.env.WEBINY_MAILER_HOST,
    user: process.env.WEBINY_MAILER_USER,
    password: process.env.WEBINY_MAILER_PASSWORD
};

export const createSmtpMailer = (config?: SmtpMailerConfig): SmtpMailer | DummyMailer => {
    /**
     * If we have environment variables, use those as config.
     */
    if (variables.host && variables.user && variables.password) {
        if (config) {
            throw new WebinyError({
                message: `Cannot use both config and environment variables to setup the nodemailer.`,
                code: "SMTP_MAILER_INIT_ERROR"
            });
        }
        config = {
            host: variables.host,
            auth: {
                user: variables.user,
                pass: variables.password
            }
        };
    } else if (!config) {
        console.log(
            "There is no config or required environment variables defined. Using dummy mailer."
        );
        return createDummyMailer();
    }
    const transporter = nodemailer.createTransport({
        ...config
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
