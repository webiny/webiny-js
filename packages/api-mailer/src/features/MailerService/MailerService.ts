import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    TransportCreateError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import type { TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(private transportFactories: MailTransportFactory.Interface[]) {}

    async sendMail<T = any>(data: TransportSendData): Abstraction.Return<T> {
        const transport = await this.createTransport();

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

    async canSend(): Promise<boolean> {
        const transport = await this.createTransport();

        return transport !== null;
    }

    // The last registered factory that is configured wins, so a project's own transport takes over.
    // Null when no factory is configured.
    private async createTransport(): Promise<MailTransport.Interface | null> {
        const factories = [...this.transportFactories].reverse();

        for (const factory of factories) {
            let transport: MailTransport.Interface | null;
            try {
                transport = await factory.createTransport();
            } catch (error) {
                throw new TransportCreateError(error);
            }

            if (transport) {
                return transport;
            }
        }

        return null;
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [[MailTransportFactory, { multiple: true }]]
});
