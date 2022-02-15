import { ApwChangeRequest, LifeCycleHookCallbackParams, ListMeta } from "~/types";

export const deleteChangeRequestsWithContentReview = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.contentReview.onAfterContentReviewDelete.subscribe(async ({ contentReview }) => {
        /**
         * Also delete all associated "changeRequest" when a "contentReview" is deleted.
         */
        const steps = contentReview.steps;
        /**
         * For each step get associated change requests and delete them.
         */
        for (let i = 0; i < steps.length; i++) {
            const { slug } = steps[i];

            let meta: Omit<ListMeta, "totalCount"> = {
                hasMoreItems: true,
                cursor: null
            };
            /**
             * Paginate through change requests.
             */
            while (meta.hasMoreItems) {
                let changeRequests: ApwChangeRequest[] = [];
                /**
                 * Get all change requests.
                 */
                try {
                    [changeRequests, meta] = await apw.changeRequest.list({
                        where: {
                            step: `${contentReview.id}#${slug}`
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
                    await apw.changeRequest.delete(changeRequest.id);
                }
            }
        }
    });
};
