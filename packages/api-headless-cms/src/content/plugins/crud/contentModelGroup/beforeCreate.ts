import { BeforeGroupCreateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { toSlug } from "~/utils";
import WebinyError from "@webiny/error";
import shortid from "shortid";

export interface Params {
    onBeforeCreate: Topic<BeforeGroupCreateTopicParams>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeGroupCreate = (params: Params) => {
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
                    locale: group.locale,
                    slug
                }
            });

            if (groups.length === 0) {
                group.slug = slug;
            } else {
                group.slug = `${slug}-${shortid.generate()}`;
            }
        }

        const groupPlugin: CmsGroupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find((item: CmsGroupPlugin) => item.contentModelGroup.slug === group.slug);

        if (groupPlugin) {
            throw new Error(
                `Cannot create "${group.slug}" content model group because one is already registered via a plugin.`
            );
        }
    });
};
