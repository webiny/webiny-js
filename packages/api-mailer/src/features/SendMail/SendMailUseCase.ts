import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { SendMail } from "./abstractions.js";
import { MailBeforeSendEvent, MailAfterSendEvent, MailSendErrorEvent } from "./events.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import type { TransportSendData } from "~/types.js";

class SendMailUseCaseImpl implements SendMail.Interface {
    constructor(
        private mailerService: MailerService.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface
    ) {}

    async execute(data: TransportSendData) {
        // Publish before send event
        await this.eventPublisher.publish(new MailBeforeSendEvent({ data }));

        // Send mail
        const result = await this.mailerService.sendMail(data);

        if (result.isFail()) {
            // Publish error event
            await this.eventPublisher.publish(
                new MailSendErrorEvent({
                    data,
                    error: result.error
                })
            );

            return result;
        }

        // Publish after send event
        await this.eventPublisher.publish(
            new MailAfterSendEvent({
                data,
                response: result.value
            })
        );

        return result;
    }
}

export const SendMailUseCaseImplementation = SendMail.createImplementation({
    implementation: SendMailUseCaseImpl,
    dependencies: [MailerService, EventPublisher]
});
