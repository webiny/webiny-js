import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import { MailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { GetSettingsRepository } from "../GetSettings/abstractions.js";
import type { TransportSettings, TransportSendData } from "~/types.js";
import { getDefaultSettingsFromEnv } from "./TransportFactory.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(
        private getSettingsRepository: GetSettingsRepository.Interface,
        private transportFactories: MailTransportFactory.Interface[]
    ) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        // Get settings from repository or environment variables
        const result = await this.getSettingsRepository.get();
        const settings = result.value ?? getDefaultSettingsFromEnv();

        if (!settings) {
            return Result.fail(new NoSettingsConfiguredError());
        }

        // Get and configure transport
        const transport = await this.getTransport(settings);

        if (!transport) {
            return Result.fail(new NoTransportAvailableError());
        }

        try {
            const response = await transport.send(data);

            // If transport.send returned an error in the response
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
    dependencies: [GetSettingsRepository, [MailTransportFactory, { multiple: true }]]
});
