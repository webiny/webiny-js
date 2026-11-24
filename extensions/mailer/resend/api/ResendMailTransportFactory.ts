import { MailTransportFactory } from "webiny/api/mailer";
import { ResendMailTransport } from "./ResendMailTransport.js";
import { RESEND_TRANSPORT_NAME } from "./ResendMailTransport.js";

class ResendMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = RESEND_TRANSPORT_NAME;

    /*
     * Configured when WEBINY_API_RESEND_API_KEY and WEBINY_API_RESEND_FROM are both set. Otherwise
     * this returns null and the mailer reports that no transport is configured.
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

export default MailTransportFactory.createImplementation({
    implementation: ResendMailTransportFactoryImpl,
    dependencies: []
});
