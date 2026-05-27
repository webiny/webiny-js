import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportCreateError,
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

        let transport: MailTransport.Interface | null;

        try {
            transport = await this.getTransport(transportName, settings);
        } catch (error) {
            return Result.fail(new TransportCreateError(error));
        }

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
        transportName: string,
        settings: TransportSettings
    ): Promise<MailTransport.Interface | null> {
        const factory = this.transportFactories.find(f => f.name === transportName);
        if (!factory) {
            return null;
        }
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
