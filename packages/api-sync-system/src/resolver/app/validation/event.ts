import zod from "zod";
import { createJsonTransform } from "~/resolver/app/validation/createJsonTransform.js";
import { createBodyValidation } from "~/resolver/app/validation/body.js";

const bodyTransform = createJsonTransform("Body");

export const createEventValidation = () => {
    return zod.array(
        zod.object({
            messageId: zod.string(),
            receiptHandle: zod.string(),
            body: bodyTransform.pipe(createBodyValidation()),
            attributes: zod.object({
                ApproximateReceiveCount: zod.string(),
                SentTimestamp: zod.string(),
                SenderId: zod.string(),
                ApproximateFirstReceiveTimestamp: zod.string()
            }),
            messageAttributes: zod.object({}).passthrough().optional(),
            md5OfBody: zod.string(),
            eventSource: zod.string(),
            eventSourceARN: zod.string(),
            awsRegion: zod.string()
        })
    );
};
