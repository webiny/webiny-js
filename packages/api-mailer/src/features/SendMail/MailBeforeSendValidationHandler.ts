import WebinyError from "@webiny/error";
import zod from "zod";
import { MailBeforeSendHandler } from "./abstractions.js";
import type { MailBeforeSendEvent } from "./events.js";
import type { SafeParseReturnType } from "zod";

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

type SchemaType = zod.infer<typeof schema>;

class MailBeforeSendValidationHandlerImpl implements MailBeforeSendHandler.Interface {
    async handle(event: MailBeforeSendEvent): Promise<void> {
        const { data: input } = event.payload;

        let result: SafeParseReturnType<SchemaType, SchemaType>;
        try {
            result = schema.safeParse(input);

            if (result.success) {
                return;
            }
            throw new WebinyError({
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    error: result.error,
                    input
                }
            });
        } catch (ex) {
            if (ex instanceof WebinyError) {
                throw ex;
            }
            throw new WebinyError({
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    input,
                    error: ex
                }
            });
        }
    }
}

export const MailBeforeSendValidationHandler = MailBeforeSendHandler.createImplementation({
    implementation: MailBeforeSendValidationHandlerImpl,
    dependencies: []
});
