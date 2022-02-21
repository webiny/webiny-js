import { ApwComment, LifeCycleHookCallbackParams, ListMeta } from "~/types";

export const deleteCommentsAfterChangeRequest = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.changeRequest.onAfterChangeRequestDelete.subscribe(async ({ changeRequest }) => {
        /**
         * Also delete all associated comments with "changeRequest".
         */
        let meta: Omit<ListMeta, "totalCount"> = {
            hasMoreItems: true,
            cursor: null
        };
        /**
         * Paginate through comments.
         */
        while (meta.hasMoreItems) {
            let comments: ApwComment[] = [];
            /**
             * Get all comments.
             */
            try {
                [comments, meta] = await apw.comment.list({
                    where: {
                        changeRequest: {
                            id: changeRequest.id
                        }
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
             * Delete comments one by one.
             */
            for (const comment of comments) {
                await apw.comment.delete(comment.id);
            }
        }
    });
};
