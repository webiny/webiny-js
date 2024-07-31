import { Topic } from "@webiny/pubsub/types";
import { CmsContext, OnModelBeforeDeleteTopicParams } from "~/types";
import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

interface AssignBeforeModelDeleteParams {
    onModelBeforeDelete: Topic<OnModelBeforeDeleteTopicParams>;
    context: CmsContext;
}
export const assignModelBeforeDelete = (params: AssignBeforeModelDeleteParams) => {
    const { onModelBeforeDelete, context } = params;

    onModelBeforeDelete.subscribe(async params => {
        const { model } = params;

        const modelPlugin = context.plugins
            .byType<CmsModelPlugin>(CmsModelPlugin.type)
            .find(item => item.contentModel.modelId === model.modelId);

        if (modelPlugin) {
            throw new WebinyError(
                "Content models defined via plugins cannot be deleted.",
                "CONTENT_MODEL_DELETE_ERROR",
                {
                    modelId: model.modelId
                }
            );
        }

        try {
            const [latestEntries] = await context.cms.listLatestEntries(model, { limit: 1 });

            if (latestEntries.length > 0) {
                throw new WebinyError(
                    `The content model "${model.modelId}" cannot be deleted because there are existing entries.`,
                    "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
                );
            }

            const [deletedEntries] = await context.cms.listDeletedEntries(model, { limit: 1 });

            if (deletedEntries.length > 0) {
                throw new WebinyError(
                    `The content model "${model.modelId}" cannot be deleted because there are entries in the trash.`,
                    "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
                );
            }
        } catch (ex) {
            throw WebinyError.from(ex, {
                message: "Could not retrieve a list of content entries from the model.",
                code: "ENTRIES_ERROR",
                data: {
                    error: ex,
                    model
                }
            });
        }
    });
};
