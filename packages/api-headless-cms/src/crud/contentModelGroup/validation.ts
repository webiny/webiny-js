import zod from "zod";
import { toSlug } from "~/utils/toSlug";

const name = zod.string().max(100);
const description = zod.string().max(255).optional();
const icon = zod.string().min(1).max(255);

export const createGroupCreateValidation = () => {
    return zod.object({
        name: name.min(1),
        slug: zod
            .string()
            .max(100)
            .optional()
            .transform(value => {
                return value ? toSlug(value) : "";
            }),
        description: description.transform(value => {
            return value || "";
        }),
        icon
    });
};

export const createGroupUpdateValidation = () => {
    return zod.object({
        name: name.optional(),
        description,
        icon: icon.optional()
    });
};
