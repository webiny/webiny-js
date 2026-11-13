import { Result } from "@webiny/feature/api";
import { MailerService as Abstraction } from "~/domain/MailerService/abstractions.js";
import {
    NoTransportAvailableError,
    TransportCreateError,
    TransportSendError
} from "~/domain/MailerService/errors.js";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { MailTransportResolver } from "~/domain/MailTransport/abstractions.js";
import type { TransportSendData } from "~/types.js";

class MailerServiceImpl implements Abstraction.Interface {
    constructor(private transportResolver: MailTransportResolver.Interface) {}

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

    private async createTransport(): Promise<MailTransport.Interface | null> {
        const resolved = await this.transportResolver.resolve();

        if (!resolved) {
            return null;
        }

        try {
            return await resolved.factory.createTransport(resolved.settings!);
        } catch (error) {
            throw new TransportCreateError(error);
        }
    }
}

export const MailerService = Abstraction.createImplementation({
    implementation: MailerServiceImpl,
    dependencies: [MailTransportResolver]
});
