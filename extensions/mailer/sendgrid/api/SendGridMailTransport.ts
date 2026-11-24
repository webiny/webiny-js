import { MailTransport } from "webiny/api/mailer";

export const SENDGRID_TRANSPORT_NAME = "Mailer/SendGridTransport";

const SENDGRID_SEND_URL = "https://api.sendgrid.com/v3/mail/send";

export interface SendGridConfig {
    apiKey: string;
    from: string;
    replyTo?: string;
}

interface SendGridAddress {
    email: string;
    name?: string;
}

/*
 * SendGrid takes the address and the display name as separate fields:
 * "Webiny <no-reply@example.com>" -> { email: "no-reply@example.com", name: "Webiny" }.
 */
const toSendGridAddress = (value: string): SendGridAddress => {
    const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    if (!match) {
        return { email: value.trim() };
    }
    const name = match[1].trim();
    return { email: match[2].trim(), name: name || undefined };
};

const toSendGridAddresses = (values?: string[]): SendGridAddress[] | undefined => {
    if (!values?.length) {
        return undefined;
    }
    return values.map(toSendGridAddress);
};

export class SendGridMailTransport implements MailTransport.Interface {
    public readonly name = SENDGRID_TRANSPORT_NAME;

    constructor(private readonly config: SendGridConfig) {}

    async send(params: MailTransport.SendParams) {
        // An explicit sender wins, as with the SMTP transport.
        const from = toSendGridAddress(params.from || this.config.from);
        const replyTo = params.replyTo || this.config.replyTo;

        /*
         * SendGrid requires a `to`. Workflow notifications only set `bcc`, so those are addressed
         * to the sender, the way a BCC-only message usually is.
         */
        let to = toSendGridAddresses(params.to);
        if (!to) {
            to = [{ email: from.email }];
        }

        // SendGrid requires text/plain before text/html.
        const content = [];
        if (params.text) {
            content.push({ type: "text/plain", value: params.text });
        }
        if (params.html) {
            content.push({ type: "text/html", value: params.html });
        }

        try {
            const response = await fetch(SENDGRID_SEND_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to,
                            cc: toSendGridAddresses(params.cc),
                            bcc: toSendGridAddresses(params.bcc)
                        }
                    ],
                    from,
                    reply_to: replyTo ? toSendGridAddress(replyTo) : undefined,
                    subject: params.subject,
                    content
                })
            });

            // SendGrid answers 202 with an empty body, and the message id in a header.
            if (response.ok) {
                return { result: response.headers.get("x-message-id"), error: null };
            }

            const body: any = await response.json().catch(() => null);
            const errors: { message?: string }[] = body?.errors ?? [];
            const message = errors
                .map(error => error.message)
                .filter(Boolean)
                .join("; ");

            return {
                result: null,
                error: {
                    message: message || `SendGrid responded with HTTP ${response.status}.`,
                    code: "SENDGRID_ERROR",
                    data: { statusCode: response.status, errors }
                }
            };
        } catch (ex) {
            // The request did not complete: DNS, connection or a timeout.
            return {
                result: null,
                error: { message: ex.message, code: "SENDGRID_REQUEST_FAILED", data: {} }
            };
        }
    }
}
