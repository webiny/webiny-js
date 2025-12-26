import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";

export class SmtpMailTransport implements MailTransport.Interface {
    public readonly name = "Mailer/SmtpTransport";
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor(config: SMTPTransport.Options) {
        this.transporter = nodemailer.createTransport(config);
    }

    async send(params: MailTransport.SendParams) {
        const { replyTo, text, html, to, bcc, cc, from, subject } = params;

        try {
            const result = await this.transporter.sendMail({
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
                    result: result.response,
                    error: null
                };
            }

            return {
                result: null,
                error: {
                    message:
                        "nodemailer.sendMail does not have a messageId in the result. Something went wrong...",
                    code: "MAILER_ERROR",
                    data: {
                        ...result
                    }
                }
            };
        } catch (ex: any) {
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
}
