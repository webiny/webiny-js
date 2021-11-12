import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupDeleteTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import WebinyError from "@webiny/error";

export interface Params {
    onBeforeDelete: Topic<BeforeGroupDeleteTopicParams>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeGroupDelete = (params: Params) => {
    const { onBeforeDelete, plugins, storageOperations } = params;

    onBeforeDelete.subscribe(async params => {
        const { group } = params;

        const groupPlugin: CmsGroupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find((item: CmsGroupPlugin) => item.contentModelGroup.slug === group.slug);

        if (groupPlugin) {
            throw new Error(`Cms Groups defined via plugins cannot be deleted.`);
        }

        const models = await storageOperations.models.list({
            where: {
                tenant: group.tenant,
                locale: group.locale
            }
        });
        const items = models.filter(model => {
            return model.group.id === group.id;
        });
        if (items.length > 0) {
            throw new WebinyError(
                "Cannot delete this group because there are models that belong to it.",
                "BEFORE_DELETE_ERROR",
                {
                    group
                }
            );
        }
    });
};
