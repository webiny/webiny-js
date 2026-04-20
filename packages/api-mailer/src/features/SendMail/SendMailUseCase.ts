import zod from "zod";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { SendMailUseCase } from "./abstractions.js";
import { MailBeforeSendEvent, MailAfterSendEvent, MailSendErrorEvent } from "./events.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import type { TransportSendData } from "~/types.js";
import { MailValidationError } from "~/domain/errors.js";
import { Result } from "@webiny/feature/api";
import { isMailboxAddress } from "~/utils/isMailboxAddress.js";

const requiredString = zod.string();
const mailboxAddress = zod
    .string()
    .refine(isMailboxAddress, { message: "Invalid email address." });

const schema = zod
    .object({
        to: zod.array(mailboxAddress).optional(),
        from: mailboxAddress.optional(),
        subject: requiredString.max(1024).min(2),
        cc: zod.array(mailboxAddress).optional(),
        bcc: zod.array(mailboxAddress).optional(),
        replyTo: mailboxAddress.optional(),
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
            return Result.fail(new MailValidationError(validation.error.issues));
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
