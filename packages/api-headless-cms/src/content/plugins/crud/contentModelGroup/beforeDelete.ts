import { Topic } from "@webiny/pubsub/types";
import { BeforeGroupDeleteTopic, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";
import WebinyError from "@webiny/error";

export interface Params {
    onBeforeDelete: Topic<BeforeGroupDeleteTopic>;
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
export const assignBeforeDelete = (params: Params) => {
    const { onBeforeDelete, plugins, storageOperations } = params;

    onBeforeDelete.subscribe(async params => {
        const { group } = params;

        const groupPlugin: ContentModelGroupPlugin = plugins
            .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
            .find((item: ContentModelGroupPlugin) => item.contentModelGroup.slug === group.slug);

        if (groupPlugin) {
            throw new Error(`Content model groups defined via plugins cannot be deleted.`);
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
