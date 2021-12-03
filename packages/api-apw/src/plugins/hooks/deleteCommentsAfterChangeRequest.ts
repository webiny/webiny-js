import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";

const deleteCommentsAfterChangeRequest = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.cms.onAfterEntryDelete.subscribe(async ({ model, entry }) => {
            const changeRequestedModel =
                await context.advancedPublishingWorkflow.changeRequest.getModel();
            /**
             * If deleted entry is of "changeRequested" model, also delete all associated comments.
             */
            if (model.modelId === changeRequestedModel.modelId) {
                let meta = {
                    hasMoreItems: true,
                    cursor: null
                };
                let comments = [];
                /**
                 * Paginate through comments.
                 */
                while (meta.hasMoreItems) {
                    /**
                     * Get all comments.
                     */
                    [comments, meta] = await context.advancedPublishingWorkflow.comment.list({
                        where: {
                            changeRequest: {
                                id: entry.id
                            }
                        },
                        after: meta.cursor
                    });

                    /**
                     * Delete comments one by one.
                     */
                    for (const comment of comments) {
                        await context.advancedPublishingWorkflow.comment.delete(comment.id);
                    }
                }
            }
        });
    });

export default () => [deleteCommentsAfterChangeRequest()];
