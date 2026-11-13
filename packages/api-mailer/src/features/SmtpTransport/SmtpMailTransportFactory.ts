import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import type { TransportSettings } from "~/types.js";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SmtpConfig } from "~/features/SmtpTransport/SmtpConfig.js";
import { SMTP_TRANSPORT_NAME } from "~/constants.js";

class SmtpMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = SMTP_TRANSPORT_NAME;

    canUse(settings: TransportSettings | null): boolean {
        return settings !== null;
    }

    async createTransport(settings: TransportSettings): MailTransportFactory.Return {
        return new SmtpMailTransport(SmtpConfig.fromTransportSettings(settings), settings.from);
    }
}

export const SmtpMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: SmtpMailTransportFactoryImpl,
    dependencies: []
});
