import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    TransportCreateError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import { MailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";
import type { TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        const { factory, transport } = await this.resolveTransport();

        if (!factory || !transport) {
            return Result.fail(new NoTransportAvailableError());
        }

        try {
            const response = await transport.send(data);

            if (response.error) {
                return Result.fail(new TransportSendError(response.error));
            }

            return Result.ok(response);
        } catch (error) {
            return Result.fail(new TransportSendError(error));
        }
    }

    private async resolveTransport(): Promise<{
        factory: MailTransportFactory.Interface | null;
        transport: MailTransport.Interface | null;
    }> {
        const factories = [...this.transportFactories].reverse();

        for (const factory of factories) {
            const result = await this.getSettingsRepository.get(factory.name);
            const { settings } = result.value;

            if (!factory.canUse(settings)) {
                continue;
            }

            try {
                const transport = await factory.createTransport(settings!);
                return { factory, transport };
            } catch (error) {
                throw new TransportCreateError(error);
            }
        }

        return { factory: null, transport: null };
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [GetSettingsRepository, [MailTransportFactory, { multiple: true }]]
});
