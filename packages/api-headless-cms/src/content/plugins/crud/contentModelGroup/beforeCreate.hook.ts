import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsBeforeCreateArgs,
    CmsContext
} from "../../../../types";
import { toSlug } from "../../../../utils";
import WebinyError from "@webiny/error";
import shortid from "shortid";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";

interface Args extends CmsContentModelGroupStorageOperationsBeforeCreateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}

const createGroupSlug = async ({ data, storageOperations, context }: Args): Promise<string> => {
    const { name, slug = "" } = data;

    const groupPlugin: ContentModelGroupPlugin = context.plugins
        .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
        .find((item: ContentModelGroupPlugin) => item.contentModelGroup.slug === slug);

    if (groupPlugin) {
        throw new Error(
            `Cannot create "${slug}" content model group because one is already registered via a plugin.`
        );
    }

    // If there is a slug assigned, check if it's unique ...
    if (slug && slug.trim()) {
        const groups = await storageOperations.list({
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
    const groups = await storageOperations.list({
        where: {
            slug: newSlug
        }
    });

    if (groups.length === 0) {
        return newSlug;
    }
    return `${newSlug}-${shortid.generate()}`;
};

export const beforeCreateHook = async ({
    context,
    input,
    data,
    storageOperations
}: Args): Promise<void> => {
    data.slug = await createGroupSlug({
        context,
        data,
        input,
        storageOperations
    });

    if (!storageOperations.beforeCreate) {
        return;
    }
    await storageOperations.beforeCreate({
        input,
        data
    });
};
