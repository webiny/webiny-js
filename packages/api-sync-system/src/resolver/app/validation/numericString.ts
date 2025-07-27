import zod from "zod";

export const createNumericStringValidation = (name: string) => {
    return zod.string().transform((value, ctx) => {
        if (/^\d+$/.test(value)) {
            return value as `${number}`;
        }
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `"${name}" must be a numeric string.`
        });
        return zod.NEVER;
    });
};
