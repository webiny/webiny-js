import { SESv2Client } from "@aws-sdk/client-sesv2";
import { MailTransportFactory } from "webiny/api/mailer";
import { SesMailTransport } from "./SesMailTransport.js";
import { SES_TRANSPORT_NAME } from "./SesMailTransport.js";

class SesMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = SES_TRANSPORT_NAME;
    private client: SESv2Client | undefined;

    /*
     * Configured when WEBINY_API_SES_FROM is set. Otherwise this returns null and the mailer
     * reports that no transport is configured.
     *
     * No credentials here: on Lambda the SDK uses the function's IAM role, anywhere else the
     * default credential chain (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, a profile, an
     * instance role).
     */
    async createTransport(): MailTransportFactory.Return {
        const from = process.env.WEBINY_API_SES_FROM;
        if (!from) {
            return null;
        }

        // One client per factory, so its connections are reused across sends.
        if (!this.client) {
            this.client = new SESv2Client({
                region: process.env.WEBINY_API_SES_REGION || process.env.AWS_REGION
            });
        }

        return new SesMailTransport(this.client, {
            from,
            replyTo: process.env.WEBINY_API_SES_REPLY_TO || undefined,
            configurationSet: process.env.WEBINY_API_SES_CONFIGURATION_SET || undefined
        });
    }
}

export default MailTransportFactory.createImplementation({
    implementation: SesMailTransportFactoryImpl,
    dependencies: []
});
