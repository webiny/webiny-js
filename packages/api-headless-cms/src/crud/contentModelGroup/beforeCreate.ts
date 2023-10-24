import { HeadlessCmsStorageOperations, OnGroupBeforeCreateTopicParams } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { toSlug } from "~/utils/toSlug";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { generateAlphaNumericId } from "@webiny/utils";

interface AssignBeforeGroupCreateParams {
    onGroupBeforeCreate: Topic<OnGroupBeforeCreateTopicParams>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeGroupCreate = (params: AssignBeforeGroupCreateParams) => {
    const { onGroupBeforeCreate, plugins, storageOperations } = params;

    onGroupBeforeCreate.subscribe(async params => {
        const { group } = params;

        if (group.id) {
            const groups = await storageOperations.groups.list({
                where: {
                    tenant: group.tenant,
                    locale: group.locale,
                    id: group.id
                }
            });
            if (groups.length > 0) {
                throw new WebinyError(
                    `Cms Group with the id "${group.id}" already exists.`,
                    "ID_ALREADY_EXISTS"
                );
            }
        }

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
                    locale: group.locale,
                    slug
                }
            });

            if (groups.length === 0) {
                group.slug = slug;
            } else {
                group.slug = `${slug}-${generateAlphaNumericId(8)}`;
            }
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
