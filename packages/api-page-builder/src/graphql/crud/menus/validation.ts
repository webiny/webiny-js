import zod from "zod";

const baseValidation = zod.object({
    title: zod.string().min(1).max(100),
    description: zod.string().max(100).optional(),
    items: zod.array(zod.object({}).passthrough()).optional()
});

export const createMenuCreateValidation = () => {
    return baseValidation.extend({
        slug: zod.string().min(1).max(100)
    });
};

export const createMenuUpdateValidation = () => {
    return baseValidation.partial();
};
