import zod from "zod";
import { toSlug } from "~/utils/toSlug";

const str = zod.string().trim();

const name = str.max(100);
const description = str.max(255).optional().nullish();
const icon = zod
    .object({
        type: zod.string().max(255),
        name: zod.string().max(255),
        value: zod.string()
    })
    .passthrough();

export const createGroupCreateValidation = () => {
    return zod.object({
        id: str.optional().nullish(),
        name: name.min(1),
        slug: str
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
