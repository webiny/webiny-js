import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupDeleteTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import WebinyError from "@webiny/error";

interface AssignBeforeGroupDeleteParams {
    onBeforeDelete: Topic<BeforeGroupDeleteTopicParams>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeGroupDelete = (params: AssignBeforeGroupDeleteParams) => {
    const { onBeforeDelete, plugins, storageOperations } = params;

    onBeforeDelete.subscribe(async params => {
        const { group } = params;

        const groupPlugin = plugins
            .byType<CmsGroupPlugin>(CmsGroupPlugin.type)
            .find(item => item.contentModelGroup.slug === group.slug);

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
