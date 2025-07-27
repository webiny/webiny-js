import zod from "zod";
import { createDetailValidation } from "./detail.js";
import { SQS_EVENT_NAME } from "~/constants.js";
import { createNumericStringValidation } from "~/resolver/app/validation/numericString.js";

const detailValidation = createDetailValidation();

export const createBodyValidation = () => {
    return zod.object({
        version: createNumericStringValidation("version"),
        id: zod.string(),
        "detail-type": zod.string().transform((value, ctx) => {
            if (value === SQS_EVENT_NAME) {
                return SQS_EVENT_NAME;
            }
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `"detail-type" must be "${SQS_EVENT_NAME}".`
            });
            return zod.NEVER;
        }),
        source: zod.string().transform((value, ctx) => {
            if (value.startsWith("webiny:")) {
                return value as `webiny:${string}`;
            }
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `"source" must start with "webiny:".`
            });
            return zod.NEVER;
        }),
        account: createNumericStringValidation("account"),
        time: zod.string().transform(value => new Date(value)),
        region: zod.string(),
        resources: zod.array(zod.string()),
        detail: detailValidation
    });
};
