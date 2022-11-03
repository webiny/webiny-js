import { Topic } from "@webiny/pubsub/types";
import { TransportSendData, OnTransportBeforeSendParams } from "~/types";
import joi, { EmailOptions } from "joi";
import WebinyError from "@webiny/error";

const options: EmailOptions = {
    tlds: false
};

const requiredString = joi.string().required();
const requiredEmail = requiredString.email(options);

const schema = joi.object<TransportSendData>({
    to: joi.array().items(requiredEmail),
    from: requiredEmail,
    subject: requiredString.max(1024),
    cc: joi.array().items(requiredEmail),
    bcc: joi.array().items(requiredEmail),
    replyTo: joi.string().email(options),
    text: requiredString.min(10),
    html: joi.string()
});

interface Params {
    onTransportBeforeSend: Topic<OnTransportBeforeSendParams>;
}
export const attachOnTransportBeforeSend = (params: Params) => {
    const { onTransportBeforeSend } = params;

    onTransportBeforeSend.subscribe(async ({ data: input }) => {
        let result: joi.ValidationResult<TransportSendData>;
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
