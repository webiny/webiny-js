import { GetSettingsRepository, MailTransportFactory } from "@webiny/api-mailer";
import { SmtpMailTransport } from "~/api/features/SmtpTransport/SmtpMailTransport.js";
import { SmtpConfig } from "~/api/features/SmtpTransport/SmtpConfig.js";
import type { TransportSettings } from "~/api/types.js";
import { SMTP_TRANSPORT_NAME } from "~/api/constants.js";

class SmtpMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = SMTP_TRANSPORT_NAME;

    constructor(private getSettingsRepository: GetSettingsRepository.Interface) {}

    // The settings come from `<Api.Mailer.Smtp>` props in code, otherwise from the settings screen.
    async createTransport(): MailTransportFactory.Return {
        const result = await this.getSettingsRepository.get<TransportSettings>(this.name);
        if (result.isFail() || !result.value.settings) {
            return null;
        }
        const { settings } = result.value;

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
