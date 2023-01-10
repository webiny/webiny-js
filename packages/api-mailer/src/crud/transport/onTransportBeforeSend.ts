import WebinyError from "@webiny/error";
import zod from "zod";
import { Topic } from "@webiny/pubsub/types";
import { OnTransportBeforeSendParams } from "~/types";
import { SafeParseReturnType } from "zod/lib/types";

const requiredString = zod.string();
const requiredEmail = requiredString.email();

const schema = zod.object({
    to: zod.array(requiredEmail),
    from: zod.string().email(),
    subject: requiredString.max(1024),
    cc: zod.array(requiredEmail),
    bcc: zod.array(requiredEmail),
    replyTo: zod.string().email(),
    text: requiredString.min(10),
    html: zod.string()
});

type SchemaType = zod.infer<typeof schema>;

interface Params {
    onTransportBeforeSend: Topic<OnTransportBeforeSendParams>;
}
export const attachOnTransportBeforeSend = (params: Params) => {
    const { onTransportBeforeSend } = params;

    onTransportBeforeSend.subscribe(async ({ data: input }) => {
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
    });
};
