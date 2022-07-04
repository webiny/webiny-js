import { Topic } from "@webiny/pubsub/types";
import { MailerSendData, OnBeforeMailerSendParams } from "~/types";
import joi from "joi";
import WebinyError from "@webiny/error";

const requiredString = joi.string().required();
const requiredEmail = requiredString.email();

const schema = joi.object<MailerSendData>({
    to: joi.array().items(requiredEmail).required(),
    from: requiredEmail,
    subject: requiredString.max(1024),
    cc: joi.array().items(requiredEmail),
    bcc: joi.array().items(requiredEmail),
    replyTo: joi.string().email(),
    text: requiredString.min(10),
    html: joi.string()
});

interface AttachOnBeforeSendParams {
    onBeforeSend: Topic<OnBeforeMailerSendParams>;
}
export const attachOnBeforeSend = (params: AttachOnBeforeSendParams) => {
    const { onBeforeSend } = params;

    onBeforeSend.subscribe(async ({ data: input }) => {
        let result: joi.ValidationResult<MailerSendData>;
        try {
            result = await schema.validate(input);

            if (!result.error) {
                return;
            }
        } catch (ex) {
            throw new WebinyError({
                message: "Error while validating e-mail params.",
                code: "VALIDATION_ERROR",
                data: {
                    input,
                    error: ex
                }
            });
        }
        throw new WebinyError({
            message: "Error while validating e-mail params.",
            code: "VALIDATION_ERROR",
            data: {
                ...result.error
            }
        });
    });
};
