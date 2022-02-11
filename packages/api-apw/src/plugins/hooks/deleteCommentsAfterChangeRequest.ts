import { LifeCycleHookCallbackParams } from "~/types";

export const deleteCommentsAfterChangeRequest = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.changeRequest.onAfterChangeRequestDelete.subscribe(async ({ changeRequest }) => {
        /**
         * Also delete all associated comments with "changeRequest".
         */
        let meta = {
            totalCount: 1
        };
        let comments = [];
        /**
         * Paginate through comments.
         */
        while (meta.totalCount > 0) {
            /**
             * Get all comments.
             */
            try {
                [comments, meta] = await apw.comment.list({
                    where: {
                        changeRequest: {
                            id: changeRequest.id
                        }
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
             * Delete comments one by one.
             */
            for (const comment of comments) {
                await apw.comment.delete(comment.id);
            }
        }
    });
};
