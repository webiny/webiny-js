import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "~/features/GetSettings/abstractions.js";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SmtpConfig } from "~/features/SmtpTransport/SmtpConfig.js";
import { SMTP_TRANSPORT_NAME } from "~/constants.js";

class SmtpMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = SMTP_TRANSPORT_NAME;

    constructor(private getSettingsRepository: GetSettingsRepository.Interface) {}

    // The settings come from code when `Api.Mailer.Smtp` sets them, otherwise from the settings form.
    async createTransport(): MailTransportFactory.Return {
        const result = await this.getSettingsRepository.get(this.name);
        const { settings } = result.value;
        if (!settings) {
            return null;
        }

        return new SmtpMailTransport(
            SmtpConfig.fromTransportSettings(settings),
            settings.from,
            settings.replyTo
        );
    }
}

export const SmtpMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: SmtpMailTransportFactoryImpl,
    dependencies: [GetSettingsRepository]
});
