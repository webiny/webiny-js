import { Topic } from "@webiny/pubsub/types";
import { BeforeModelDeleteTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/content/plugins/CmsModelPlugin";

export interface Params {
    onBeforeDelete: Topic<BeforeModelDeleteTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}
export const assignBeforeModelDelete = (params: Params) => {
    const { onBeforeDelete, storageOperations, plugins } = params;

    onBeforeDelete.subscribe(async params => {
        const { model } = params;

        const modelPlugin: CmsModelPlugin = plugins
            .byType<CmsModelPlugin>(CmsModelPlugin.type)
            .find((item: CmsModelPlugin) => item.contentModel.modelId === model.modelId);

        if (modelPlugin) {
            throw new WebinyError(
                "Content models defined via plugins cannot be deleted.",
                "CONTENT_MODEL_DELETE_ERROR",
                {
                    modelId: model.modelId
                }
            );
        }

        let entries = [];
        try {
            const result = await storageOperations.entries.list(model, {
                where: {
                    tenant: model.tenant,
                    locale: model.locale
                },
                limit: 1
            });
            entries = result.items;
        } catch (ex) {
            throw new WebinyError(
                "Could not retrieve a list of content entries from the model.",
                "ENTRIES_ERROR",
                {
                    error: ex,
                    model
                }
            );
        }
        if (entries.length > 0) {
            throw new WebinyError(
                `Cannot delete content model "${model.modelId}" because there are existing entries.`,
                "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
            );
        }
    });
};
