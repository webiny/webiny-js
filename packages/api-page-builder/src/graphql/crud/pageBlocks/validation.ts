import zod from "zod";

const refineValidation = (value?: string) => {
    if (!value) {
        return false;
    } else if (value.match(/^[a-z0-9]+(-[a-z0-9]+)*$/) === null) {
        return false;
    }
    return true;
};

const refineValidationMessage = (value?: string) => {
    if (!value) {
        return {
            message: "Value is required."
        };
    }
    return {
        message:
            "Slug must consist of only 'a-z', '0-9' and '-' and be max 100 characters long (for example: 'some-slug' or 'some-slug-2')"
    };
};

const baseValidation = zod.object({
    name: zod.string().min(1).max(100),
    content: zod.union([zod.object({}).passthrough(), zod.array(zod.object({}).passthrough())])
});

export const createPageBlocksCreateValidation = () => {
    return baseValidation.extend({
        blockCategory: zod
            .string()
            .min(1)
            .max(100)
            .refine(refineValidation, refineValidationMessage),
        preview: zod
            .object({
                id: zod.string(),
                src: zod.string()
            })
            .partial()
            .passthrough()
    });
};

export const createPageBlocksUpdateValidation = () => {
    return baseValidation
        .extend({
            blockCategory: zod
                .string()
                .max(100)
                .optional()
                .transform(value => {
                    return value || undefined;
                })
                .refine(value => {
                    if (!value) {
                        return true;
                    }
                    return refineValidation(value);
                }, refineValidationMessage),
            preview: zod
                .object({
                    id: zod.string(),
                    src: zod.string()
                })
                .partial()
                .passthrough()
                .optional()
        })
        .partial();
};
