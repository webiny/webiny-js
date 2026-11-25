import zod from "zod";
import type { Container } from "@webiny/di";
import { MailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import { GetSettingsRepository } from "~/features/GetSettings/abstractions.js";

export const SETTINGS_TRANSPORT = "Acme/HttpTransport";

interface AcmeSettings extends TransportSettingsDefinition.Values {
    apiKey: string;
    region: string;
    from: string;
}

/*
 * A transport that is not SMTP and keeps its settings in the core mailer store: an API key (a
 * secret, bound to the region) and a sender. `send` receives the settings it was built with.
 */
export const registerSettingsTransport = (
    send: (settings: AcmeSettings, params: MailTransport.SendParams) => Promise<any>
) => {
    class AcmeSettingsDefinition implements TransportSettingsDefinition.Interface {
        public readonly transport = SETTINGS_TRANSPORT;
        public readonly schema = zod.object({
            apiKey: zod.string().optional(),
            region: zod.string().optional(),
            from: zod.string()
        });
        public readonly secrets = ["apiKey"];
        public readonly secretsBoundTo = ["region"];

        withDefaults(settings: TransportSettingsDefinition.Values) {
            return { ...settings, region: settings.region ?? "eu" };
        }
    }

    class AcmeTransportFactory implements MailTransportFactory.Interface {
        public readonly name = SETTINGS_TRANSPORT;

        constructor(private repository: GetSettingsRepository.Interface) {}

        async createTransport() {
            const result = await this.repository.get<AcmeSettings>(this.name);
            const settings = result.isOk() ? result.value.settings : null;
            if (!settings?.apiKey) {
                return null;
            }
            return {
                name: this.name,
                send: (params: MailTransport.SendParams) => send(settings, params)
            };
        }
    }

    return (container: Container) => {
        container.register(
            TransportSettingsDefinition.createImplementation({
                implementation: AcmeSettingsDefinition,
                dependencies: []
            })
        );
        container.register(
            MailTransportFactory.createImplementation({
                implementation: AcmeTransportFactory,
                dependencies: [GetSettingsRepository]
            })
        );
    };
};
