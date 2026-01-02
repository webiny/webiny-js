import zod from "zod";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { SendMailUseCase } from "./abstractions.js";
import { MailBeforeSendEvent, MailAfterSendEvent, MailSendErrorEvent } from "./events.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import type { TransportSendData } from "~/types.js";
import { MailValidationError } from "~/domain/errors.js";
import { Result } from "@webiny/feature/api";

const requiredString = zod.string();
const requiredEmail = requiredString.email();

const schema = zod
    .object({
        to: zod.array(requiredEmail).optional(),
        from: zod.string().email().optional(),
        subject: requiredString.max(1024).min(2),
        cc: zod.array(requiredEmail).optional(),
        bcc: zod.array(requiredEmail).optional(),
        replyTo: zod.string().email().optional(),
        text: zod.string().optional(),
        html: zod.string().optional()
    })
    .refine(data => {
        return !!data.text || !!data.html;
    }, "Either text or html is required.");

class SendMailUseCaseImpl implements SendMailUseCase.Interface {
    constructor(
        private mailerService: MailerService.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface
    ) {}

    async execute(data: TransportSendData) {
        const validation = schema.safeParse(data);
        if (!validation.success) {
            return Result.fail(new MailValidationError(validation.error.errors));
        }

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

export const SendMailUseCaseImplementation = SendMailUseCase.createImplementation({
    implementation: SendMailUseCaseImpl,
    dependencies: [MailerService, EventPublisher]
});
