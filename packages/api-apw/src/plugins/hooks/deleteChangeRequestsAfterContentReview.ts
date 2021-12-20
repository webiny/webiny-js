import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";

const deleteChangeRequestsWithContentReview = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.cms.onAfterEntryDelete.subscribe(async ({ model, entry }) => {
            const contentReviewModel = await context.apw.contentReview.getModel();
            /**
             * If deleted entry is of "contentReview" model, also delete all associated changeRequests.
             */
            if (model.modelId === contentReviewModel.modelId) {
                const steps = entry.values.steps;
                /**
                 * For each step get associated change requests and delete them.
                 */
                for (let i = 0; i < steps.length; i++) {
                    const { slug } = steps[i];

                    let meta = {
                        hasMoreItems: true,
                        cursor: null
                    };
                    let changeRequests = [];
                    /**
                     * Paginate through change requests.
                     */
                    while (meta.hasMoreItems) {
                        /**
                         * Get all change requests.
                         */
                        try {
                            [changeRequests, meta] = await context.apw.changeRequest.list({
                                where: {
                                    step: slug
                                },
                                after: meta.cursor
                            });
                        } catch (e) {
                            meta.hasMoreItems = false;
                            if (e.message !== "index_not_found_exception") {
                                throw e;
                            }
                        }

                        /**
                         * Delete change requests one by one.
                         */
                        for (const changeRequest of changeRequests) {
                            await context.apw.changeRequest.delete(changeRequest.id);
                        }
                    }
                }
            }
        });
    });

export default () => deleteChangeRequestsWithContentReview();
