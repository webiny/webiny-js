import { MailTransportFactory } from "@webiny/api-mailer";
import { ResendMailTransport } from "./ResendMailTransport.js";
import { RESEND_TRANSPORT_NAME } from "./constants.js";

class ResendMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = RESEND_TRANSPORT_NAME;

    /*
     * Configured when WEBINY_API_RESEND_API_KEY and WEBINY_API_RESEND_FROM are both set. Read on
     * every send, so changing them takes effect without a rebuild.
     */
    async createTransport(): MailTransportFactory.Return {
        const apiKey = process.env.WEBINY_API_RESEND_API_KEY;
        const from = process.env.WEBINY_API_RESEND_FROM;
        if (!apiKey || !from) {
            return null;
        }

        return new ResendMailTransport({
            apiKey,
            from,
            replyTo: process.env.WEBINY_API_RESEND_REPLY_TO || undefined
        });
    }
}

export const ResendMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: ResendMailTransportFactoryImpl,
    dependencies: []
});
