import { MailTransport } from "@webiny/api-mailer";
import { parseMailbox } from "@webiny/api-mailer";
import { RESEND_EMAILS_URL } from "./constants.js";
import { RESEND_TRANSPORT_NAME } from "./constants.js";

export interface ResendConfig {
    apiKey: string;
    from: string;
    replyTo?: string;
}

export class ResendMailTransport implements MailTransport.Interface {
    public readonly name = RESEND_TRANSPORT_NAME;

    constructor(private readonly config: ResendConfig) {}

    async send(params: MailTransport.SendParams) {
        // An explicit sender wins, as with the SMTP transport.
        const from = params.from || this.config.from;
        const replyTo = params.replyTo || this.config.replyTo;

        /*
         * Resend requires `to`. Workflow notifications only set `bcc`, so those are addressed to
         * the sender, the way a BCC-only message usually is.
         */
        let to = params.to;
        if (!to?.length) {
            to = [parseMailbox(from)?.address ?? from];
        }

        try {
            const response = await fetch(RESEND_EMAILS_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from,
                    to,
                    cc: params.cc?.length ? params.cc : undefined,
                    bcc: params.bcc?.length ? params.bcc : undefined,
                    reply_to: replyTo || undefined,
                    subject: params.subject,
                    text: params.text,
                    html: params.html
                })
            });

            const body: any = await response.json().catch(() => null);

            if (!response.ok) {
                return {
                    result: null,
                    error: {
                        message: body?.message ?? `Resend responded with HTTP ${response.status}.`,
                        code: body?.name ?? "RESEND_ERROR",
                        data: { statusCode: response.status }
                    }
                };
            }

            return { result: body?.id ?? null, error: null };
        } catch (ex) {
            // The request did not complete: DNS, connection or a timeout.
            return {
                result: null,
                error: { message: ex.message, code: "RESEND_REQUEST_FAILED", data: {} }
            };
        }
    }
}
