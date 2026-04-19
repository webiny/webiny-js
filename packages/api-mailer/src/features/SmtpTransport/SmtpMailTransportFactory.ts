import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import type { TransportSettings } from "~/types.js";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SmtpConfig } from "~/features/SmtpTransport/SmtpConfig.js";

class SmtpMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = "Mailer/SmtpTransport";

    async createTransport(settings: TransportSettings): MailTransportFactory.Return {
        return new SmtpMailTransport(SmtpConfig.fromTransportSettings(settings));
    }
}

export const SmtpMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: SmtpMailTransportFactoryImpl,
    dependencies: []
});
