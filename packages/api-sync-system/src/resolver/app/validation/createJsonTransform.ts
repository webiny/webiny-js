import zod from "zod";
import { parseJson } from "@webiny/utils/parseJson.js";

export const createJsonTransform = (name: string) => {
    return zod.string().transform((value, ctx) => {
        try {
            return parseJson(value);
        } catch {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `${name} must be a valid JSON string.`
            });
            return zod.NEVER;
        }
    });
};
