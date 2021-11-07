import { BeforeGroupCreateTopic, HeadlessCmsStorageOperations } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { toSlug } from "~/utils";
import WebinyError from "@webiny/error";
import shortid from "shortid";

export interface Params {
    onBeforeCreate: Topic<BeforeGroupCreateTopic>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeCreate = (params: Params) => {
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
                    `Content model group with the slug "${group.slug}" already exists.`,
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

        const groupPlugin: ContentModelGroupPlugin = plugins
            .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
            .find((item: ContentModelGroupPlugin) => item.contentModelGroup.slug === group.slug);

        if (groupPlugin) {
            throw new Error(
                `Cannot create "${group.slug}" content model group because one is already registered via a plugin.`
            );
        }
    });
};
