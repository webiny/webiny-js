import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { MailTransportResolver as Abstraction } from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";

class MailTransportResolverImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async resolve(): Promise<Abstraction.Resolved | null> {
        const factories = [...this.transportFactories].reverse();

        for (const factory of factories) {
            const result = await this.getSettingsRepository.get(factory.name);
            const { settings } = result.value;

            if (factory.canUse(settings)) {
                return { factory, settings };
            }
        }

        return null;
    }
}

export const MailTransportResolver = Abstraction.createImplementation({
    implementation: MailTransportResolverImpl,
    dependencies: [GetSettingsRepository, [MailTransportFactory, { multiple: true }]]
});
