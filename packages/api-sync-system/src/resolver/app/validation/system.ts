import zod from "zod";

export const createSystemValidation = () => {
    return zod.object({
        name: zod.string(),
        env: zod.string(),
        variant: zod
            .string()
            .optional()
            .nullish()
            .transform(value => value || undefined),
        region: zod.string(),
        version: zod.string()
    });
};
