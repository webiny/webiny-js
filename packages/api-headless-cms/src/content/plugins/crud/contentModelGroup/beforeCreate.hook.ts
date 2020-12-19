import { CmsContentModelGroupType, CmsContext } from "@webiny/api-headless-cms/types";
import { toSlug } from "@webiny/api-headless-cms/utils";
import Error from "@webiny/error";
import shortid from "shortid";

export const beforeCreateHook = async (
    context: CmsContext,
    model: CmsContentModelGroupType
): Promise<void> => {
    const { name, slug = "" } = model;
    // If there is a slug assigned, check if it's unique ...
    if (slug.trim()) {
        const groups = await context.cms.groups.list({
            where: {
                slug
            },
            limit: 1
        });
        if (groups.length === 0) {
            return;
        }
        throw new Error(
            `Content model group with the slug "${slug}" already exists.`,
            "SLUG_ALREADY_EXISTS"
        );
    }

    // ... otherwise, assign a unique slug automatically.
    const newSlug = toSlug(name);
    const groups = await context.cms.groups.list({
        where: {
            slug: newSlug
        },
        limit: 1
    });

    if (groups.length === 0) {
        model.slug = newSlug;
        return;
    }

    model.slug = `${newSlug}-${shortid.generate()}`;
};
