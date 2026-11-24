import { MailTransportFactory } from "@webiny/api-mailer";
import { SendGridMailTransport } from "./SendGridMailTransport.js";
import { SENDGRID_TRANSPORT_NAME } from "./constants.js";

class SendGridMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = SENDGRID_TRANSPORT_NAME;

    /*
     * Configured when WEBINY_API_SENDGRID_API_KEY and WEBINY_API_SENDGRID_FROM are both set. Read
     * on every send, so changing them takes effect without a rebuild.
     */
    async createTransport(): MailTransportFactory.Return {
        const apiKey = process.env.WEBINY_API_SENDGRID_API_KEY;
        const from = process.env.WEBINY_API_SENDGRID_FROM;
        if (!apiKey || !from) {
            return null;
        }

        return new SendGridMailTransport({
            apiKey,
            from,
            replyTo: process.env.WEBINY_API_SENDGRID_REPLY_TO || undefined
        });
    }
}

export const SendGridMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: SendGridMailTransportFactoryImpl,
    dependencies: []
});
