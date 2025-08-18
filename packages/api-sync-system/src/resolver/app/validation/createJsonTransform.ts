import zod from "zod";

export const createJsonTransform = (name: string) => {
    return zod.string().transform((value, ctx) => {
        try {
            return JSON.parse(value);
        } catch {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `${name} must be a valid JSON string.`
            });
            return zod.NEVER;
        }
    });
};
