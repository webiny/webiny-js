import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { SMTP_TRANSPORT_NAME } from "~/constants.js";

/*
 * A host with both IPv4 and IPv6 addresses (`localhost`, most mail providers) fails to connect
 * with an AggregateError: one error per address and an empty message of its own.
 */
const getErrorMessage = (ex: any): string => {
    if (ex.message) {
        return ex.message;
    }
    if (Array.isArray(ex.errors)) {
        return ex.errors
            .map((error: Error) => error.message)
            .filter(Boolean)
            .join("; ");
    }
    return "";
};

export class SmtpMailTransport implements MailTransport.Interface {
    public readonly name = SMTP_TRANSPORT_NAME;
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor(
        config: SMTPTransport.Options,
        private readonly defaultFrom?: string,
        private readonly defaultReplyTo?: string
    ) {
        this.transporter = nodemailer.createTransport(config);
    }

    async send(params: MailTransport.SendParams) {
        const { replyTo, text, html, to, bcc, cc, from, subject } = params;

        try {
            const result = await this.transporter.sendMail({
                replyTo: replyTo || this.defaultReplyTo || undefined,
                bcc,
                cc,
                // An explicit sender wins; otherwise the configured settings sender (R201).
                // An empty default counts as none, so a missing settings `from` changes nothing.
                from: from || this.defaultFrom || undefined,
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
            // Allow-list specific nodemailer/SMTP error fields. Spreading `ex`
            // or `ex.data` blindly would risk surfacing the transporter's auth
            // config (or anything else a future nodemailer version stamps onto
            // its errors) in error responses.
            return {
                result: null,
                error: {
                    message: getErrorMessage(ex),
                    code: ex.code,
                    data: {
                        ...params,
                        command: ex.command,
                        response: ex.response,
                        responseCode: ex.responseCode
                    }
                }
            };
        }
    }
}
