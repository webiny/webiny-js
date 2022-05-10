import WebinyError from "@webiny/error";
import { BeforeGroupCreateTopicParams, CmsGroup, HeadlessCmsStorageOperations } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { toSlug } from "~/utils";
import { generateAlphaNumericId } from "@webiny/utils";

const createGroupSlug = (groups: CmsGroup[], initialSlug: string): string => {
    let slug = initialSlug;
    for (let current = 0; current < 10; current++) {
        if (groups.some(g => g.slug === slug)) {
            slug = `${initialSlug}-${generateAlphaNumericId(8)}`;
            continue;
        }
        return slug;
    }
    throw new WebinyError("Could not determine group slug after 10 tries", "GROUP_SLUG_ERROR", {
        initialSlug,
        slug
    });
};

interface AssignBeforeGroupCreateParams {
    onBeforeCreate: Topic<BeforeGroupCreateTopicParams>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeGroupCreate = (params: AssignBeforeGroupCreateParams) => {
    const { onBeforeCreate, plugins, storageOperations } = params;

    onBeforeCreate.subscribe(async params => {
        const { group } = params;

        if (group.slug && group.slug.trim()) {
            const groups = await storageOperations.groups.list({
                where: {
                    tenant: group.tenant,
                    locale: group.locale,
                    slug: group.slug
                }
            });
            if (groups.length > 0) {
                throw new WebinyError(
                    `Cms Group with the slug "${group.slug}" already exists.`,
                    "SLUG_ALREADY_EXISTS"
                );
            }
        } else {
            const slug = toSlug(group.name);
            const groups = await storageOperations.groups.list({
                where: {
                    tenant: group.tenant,
                    locale: group.locale
                }
            });

            group.slug = createGroupSlug(groups, slug);
        }

        const groupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find(item => item.contentModelGroup.slug === group.slug);

        if (groupPlugin) {
            throw new Error(
                `Cannot create "${group.slug}" content model group because one is already registered via a plugin.`
            );
        }
    });
};
