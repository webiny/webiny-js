import { Topic } from "@webiny/pubsub/types";
import { CmsContext, OnModelBeforeDeleteTopicParams } from "~/types";
import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";

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

        const tags = Array.isArray(model.tags) ? model.tags : [];
        /**
         * If the model is a singleton, we need to delete all entries.
         * There will be either 0 or 1 entries in latest or deleted, but let's put high limit, just in case...
         */
        if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
            const [latestEntries] = await context.cms.listLatestEntries(model, {
                limit: 10000
            });

            if (latestEntries.length > 0) {
                for (const item of latestEntries) {
                    await context.cms.deleteEntry(model, item.id, {
                        permanently: true
                    });
                }
                return;
            }

            const [deletedEntries] = await context.cms.listDeletedEntries(model, {
                limit: 10000
            });

            if (deletedEntries.length === 0) {
                return;
            }

            for (const item of deletedEntries) {
                await context.cms.deleteEntry(model, item.id, {
                    permanently: true
                });
            }

            return;
        }

        try {
            const [latestEntries] = await context.cms.listLatestEntries(model, { limit: 1 });

            if (latestEntries.length > 0) {
                throw new WebinyError(
                    `Cannot delete content model "${model.modelId}" because there are existing entries.`,
                    "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
                );
            }

            const [deletedEntries] = await context.cms.listDeletedEntries(model, { limit: 1 });

            if (deletedEntries.length > 0) {
                throw new WebinyError(
                    `Cannot delete content model "${model.modelId}" because there are existing entries in the trash.`,
                    "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
                );
            }
        } catch (ex) {
            throw WebinyError.from(ex, {
                message: "Could not retrieve a list of content entries from the model.",
                code: "ENTRIES_ERROR",
                data: {
                    model
                }
            });
        }
    });
};
