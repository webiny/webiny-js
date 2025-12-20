import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/feature/api";
import {
    SendMail,
    MailBeforeSendEvent,
    MailAfterSendEvent,
    MailSendErrorEvent
} from "./abstractions.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import type { TransportSendData } from "~/types.js";

class SendMailUseCaseImpl implements SendMail.Interface {
    constructor(
        private mailerService: MailerService.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute<D = any>(data: TransportSendData) {
        try {
            // Publish before send event
            await this.eventPublisher.publish(
                new MailBeforeSendEvent({
                    payload: { data }
                })
            );

            // Send mail
            const result = await this.mailerService.sendMail<D>(data);

            if (result.isFail()) {
                // Publish error event
                await this.eventPublisher.publish(
                    new MailSendErrorEvent({
                        payload: { data, error: result.error }
                    })
                );

                return result;
            }

            // Publish after send event
            await this.eventPublisher.publish(
                new MailAfterSendEvent<D>({
                    payload: { data, response: result.value }
                })
            );

            return result;
        } catch (error: any) {
            // Publish error event for unexpected errors
            await this.eventPublisher.publish(
                new MailSendErrorEvent({
                    payload: { data, error }
                })
            );

            throw error;
        }
    }
}

export const SendMailUseCaseImplementation = SendMail.createImplementation({
    implementation: SendMailUseCaseImpl,
    dependencies: [MailerService, EventPublisher]
});
