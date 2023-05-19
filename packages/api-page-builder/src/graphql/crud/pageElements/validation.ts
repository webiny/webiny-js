import zod from "zod";

const baseValidation = zod.object({
    name: zod.string().max(100),
    type: zod.enum(["element", "block"]),
    category: zod.string().max(100),
    content: zod.object({}).partial().passthrough(),
    preview: zod.object({}).partial().passthrough()
});

export const createPageElementsCreateValidation = () => {
    return baseValidation;
};

export const createPageElementsUpdateValidation = () => {
    return baseValidation
        .extend({
            type: zod.enum(["element", "block"]).optional()
        })
        .partial();
};
