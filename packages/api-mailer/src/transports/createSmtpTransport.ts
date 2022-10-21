/**
 * Nodemailer docs
 * https://nodemailer.com/about/
 */
import { Transport } from "~/types";
import WebinyError from "@webiny/error";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport, { Options } from "nodemailer/lib/smtp-transport";

export type SmtpTransportConfig = Options;

export interface SmtpTransport extends Transport {
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
}

export const createSmtpTransport = (config?: Partial<SmtpTransportConfig>): SmtpTransport => {
    if (!config) {
        throw new WebinyError("There is no configuration for the SMTP transport.");
    }

    const transporter = nodemailer.createTransport(config);

    return {
        name: "smtp-default",
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
