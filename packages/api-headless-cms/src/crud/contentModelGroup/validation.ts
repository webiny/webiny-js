import zod from "zod";
import { toSlug } from "~/utils/toSlug";

const str = zod.string().trim();

const name = str.max(100);
const description = str.max(255).optional().nullish();
const icon = str.min(1).max(255);

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
