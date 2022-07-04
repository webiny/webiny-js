/**
 * Nodemailer docs
 * https://nodemailer.com/about/
 */
import { MailerSender } from "~/types";
import WebinyError from "@webiny/error";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export interface SmtpSenderConfig {
    from?: string;
    replyTo?: string;
    url: string;
    username: string;
    password: string;
}
export interface SmtpSender extends MailerSender {
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
}

export const createSmtpSender = (config: SmtpSenderConfig): SmtpSender => {
    const transporter = nodemailer.createTransport({
        replyTo: config.replyTo,
        from: config.from,
        url: config.url,
        auth:
            config.username && config.password
                ? {
                      user: config.username,
                      pass: config.password
                  }
                : undefined
    });

    return {
        transporter,
        send: async params => {
            const { replyTo, body, to, bcc, cc, from, subject } = params;

            try {
                const result = await transporter.sendMail({
                    replyTo,
                    bcc,
                    cc,
                    from,
                    html: body,
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
                        "nodemailer.sendMail did not result a messageId property. Something went wrong...",
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
