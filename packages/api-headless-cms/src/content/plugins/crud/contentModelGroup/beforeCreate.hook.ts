import {
    CmsContentModelGroupCrud,
    CmsContentModelGroupCrudBeforeCreateArgs,
    CmsContext
} from "../../../../types";
import { toSlug } from "../../../../utils";
import WebinyError from "@webiny/error";
import shortid from "shortid";

interface Args extends CmsContentModelGroupCrudBeforeCreateArgs {
    context: CmsContext;
    crud: CmsContentModelGroupCrud;
}

const createGroupSlug = async ({ data, crud }: Args): Promise<string> => {
    const { name, slug = "" } = data;
    // If there is a slug assigned, check if it's unique ...
    if (slug && slug.trim()) {
        const groups = await crud.list({
            where: {
                slug
            }
        });
        if (groups.length === 0) {
            return slug;
        }
        throw new WebinyError(
            `Content model group with the slug "${slug}" already exists.`,
            "SLUG_ALREADY_EXISTS"
        );
    }

    // ... otherwise, assign a unique slug automatically.
    const newSlug = toSlug(name);
    const groups = await crud.list({
        where: {
            slug: newSlug
        }
    });

    if (groups.length === 0) {
        return newSlug;
    }
    return `${newSlug}-${shortid.generate()}`;
};

export const beforeCreateHook = async ({ context, input, data, crud }: Args): Promise<void> => {
    data.slug = await createGroupSlug({
        context,
        data,
        input,
        crud
    });

    if (!crud.beforeCreate) {
        return;
    }
    await crud.beforeCreate({
        input,
        data
    });
};
