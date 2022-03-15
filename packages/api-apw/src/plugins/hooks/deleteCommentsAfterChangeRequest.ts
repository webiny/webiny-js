import { ApwComment, LifeCycleHookCallbackParams, ListMeta } from "~/types";

export const deleteCommentsAfterChangeRequest = ({
    apw
}: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.changeRequest.onAfterChangeRequestDelete.subscribe(async ({ changeRequest }) => {
        /**
         * Also delete all associated comments with "changeRequest".
         */
        let meta: Pick<ListMeta, "totalCount"> = {
            totalCount: 1
        };
        /**
         * Paginate through comments.
         */
        while (meta.totalCount > 0) {
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
