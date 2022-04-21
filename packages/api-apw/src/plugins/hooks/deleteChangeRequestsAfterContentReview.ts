import { ApwChangeRequest, LifeCycleHookCallbackParams, ListMeta } from "~/types";

export const deleteChangeRequestsWithContentReview = ({
    apw
}: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.contentReview.onAfterContentReviewDelete.subscribe(async ({ contentReview }) => {
        /**
         * Also delete all associated "changeRequest" when a "contentReview" is deleted.
         */
        const steps = contentReview.steps;
        /**
         * For each step get associated change requests and delete them.
         */
        for (let i = 0; i < steps.length; i++) {
            const { id: stepId } = steps[i];

            let meta: Pick<ListMeta, "totalCount"> = {
                totalCount: 1
            };
            /**
             * Paginate through change requests.
             */
            while (meta.totalCount > 0) {
                let changeRequests: ApwChangeRequest[] = [];
                /**
                 * Get all change requests.
                 */
                try {
                    [changeRequests, meta] = await apw.changeRequest.list({
                        where: {
                            step: `${contentReview.id}#${stepId}`
                        }
                    });
                } catch (e) {
                    meta.totalCount = 0;
                    if (e.message !== "index_not_found_exception") {
                        throw e;
                    }
                    console.log(e);
                }

                /**
                 * Delete change requests one by one.
                 */
                for (const changeRequest of changeRequests) {
                    await apw.changeRequest.delete(changeRequest.id);
                }
            }
        }
    });
};
