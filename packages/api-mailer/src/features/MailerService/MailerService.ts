import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import {
    ActiveTransport,
    MailTransport,
    MailTransportFactory
} from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";
import type { TransportSettings, TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private activeTransport: ActiveTransport.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        const transportName = this.activeTransport.name();

        if (!transportName) {
            return Result.fail(new NoTransportAvailableError());
        }

        const result = await this.getSettingsRepository.get(transportName);
        const { settings } = result.value;

        if (!settings) {
            return Result.fail(new NoSettingsConfiguredError());
        }

        const transport = await this.getTransport(settings);

        if (!transport) {
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

    private async getTransport(
        settings: TransportSettings
    ): Promise<MailTransport.Interface | null> {
        if (this.transportFactories.length === 0) {
            return null;
        }

        const factory = this.transportFactories[this.transportFactories.length - 1];

        return factory.createTransport(settings);
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [
        GetSettingsRepository,
        ActiveTransport,
        [MailTransportFactory, { multiple: true }]
    ]
});
