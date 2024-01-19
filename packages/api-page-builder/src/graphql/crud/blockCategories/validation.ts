import zod from "zod";

export const createBlockCategoryCreateValidation = () => {
    return zod.object({
        slug: zod
            .string()
            .max(100)
            .refine(
                value => {
                    if (!value) {
                        return false;
                    } else if (value.match(/^[a-z0-9]+(-[a-z0-9]+)*$/) === null) {
                        return false;
                    }
                    return true;
                },
                value => {
                    if (!value) {
                        return {
                            message: "Value is required."
                        };
                    }
                    return {
                        message:
                            "Slug must consist of only 'a-z', '0-9' and '-' and be max 100 characters long (for example: 'some-slug' or 'some-slug-2')"
                    };
                }
            ),
        name: zod.string().min(1).max(100),
        icon: zod
            .object({
                type: zod.string().max(255),
                name: zod.string().max(255),
                value: zod.string()
            })
            .passthrough(),
        description: zod.string().min(1).max(100)
    });
};

export const createBlockCategoryUpdateValidation = () => {
    return zod
        .object({
            name: zod.string().min(1).max(100),
            icon: zod
                .object({
                    type: zod.string().max(255),
                    name: zod.string().max(255),
                    value: zod.string()
                })
                .passthrough(),
            description: zod.string().min(1).max(100)
        })
        .partial();
};
