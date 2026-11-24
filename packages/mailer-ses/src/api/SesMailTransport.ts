import { SendEmailCommand } from "@webiny/aws-sdk/client-sesv2/index.js";
import type { SESv2Client } from "@webiny/aws-sdk/client-sesv2/index.js";
import { MailTransport } from "@webiny/api-mailer";
import { SES_TRANSPORT_NAME } from "./constants.js";

export interface SesConfig {
    from: string;
    replyTo?: string;
    configurationSet?: string;
}

export class SesMailTransport implements MailTransport.Interface {
    public readonly name = SES_TRANSPORT_NAME;

    constructor(
        private readonly client: Pick<SESv2Client, "send">,
        private readonly config: SesConfig
    ) {}

    async send(params: MailTransport.SendParams) {
        const replyTo = params.replyTo || this.config.replyTo;

        let text;
        if (params.text) {
            text = { Data: params.text, Charset: "UTF-8" };
        }
        let html;
        if (params.html) {
            html = { Data: params.html, Charset: "UTF-8" };
        }

        try {
            const response = await this.client.send(
                new SendEmailCommand({
                    // An explicit sender wins, as with the SMTP transport.
                    FromEmailAddress: params.from || this.config.from,
                    ReplyToAddresses: replyTo ? [replyTo] : undefined,
                    Destination: {
                        ToAddresses: params.to,
                        CcAddresses: params.cc,
                        BccAddresses: params.bcc
                    },
                    Content: {
                        Simple: {
                            Subject: { Data: params.subject, Charset: "UTF-8" },
                            Body: { Text: text, Html: html }
                        }
                    },
                    ConfigurationSetName: this.config.configurationSet
                })
            );

            return { result: response.MessageId ?? null, error: null };
        } catch (ex) {
            /*
             * Only the error's name, message and request id. The SDK error also carries the
             * request, which is not worth returning to a GraphQL caller.
             */
            return {
                result: null,
                error: {
                    message: ex.message,
                    code: ex.name ?? "SES_ERROR",
                    data: { requestId: ex.$metadata?.requestId }
                }
            };
        }
    }
}
