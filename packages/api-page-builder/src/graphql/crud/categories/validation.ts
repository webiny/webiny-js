import zod from "zod";

const baseValidation = zod.object({
    name: zod.string().min(1).max(100),
    url: zod.string().min(1).max(100),
    layout: zod.string().min(1).max(100)
});

export const createCategoryCreateValidation = () => {
    return baseValidation.extend({
        slug: zod.string().min(1).max(100)
    });
};

export const createCategoryUpdateValidation = () => {
    return baseValidation.partial();
};
