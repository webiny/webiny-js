import { LifeCycleHookCallbackParams } from "~/types";
import {
    extractContentReviewIdAndStep,
    updateContentReview,
    updateContentReviewStep
} from "../utils";

export const updateTotalCommentsCount = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.comment.onAfterCommentDelete.subscribe(async ({ comment }) => {
        /**
         * There is a cycle between "ContentReview", "ChangeRequest" and "Comment" on
         * delete event. So it is possible, "ChangeRequest" doesn't exists, in that case,
         * we'll bail out early.
         */
        let changeRequest;
        try {
            changeRequest = await apw.changeRequest.get(comment.changeRequest);
        } catch (e) {
            if (e.code !== "NOT_FOUND") {
                throw e;
            }
        }
        /**
         * After a "comment" is deleted, decrement the "totalComments" count
         * in the corresponding step of the content review entry.
         */
        if (changeRequest) {
            const { id, stepId } = extractContentReviewIdAndStep(changeRequest.step);

            await updateContentReview({
                contentReviewMethods: apw.contentReview,
                id,
                getNewContentReviewData: data => {
                    return {
                        ...data,
                        steps: updateContentReviewStep(data.steps, stepId, step => ({
                            ...step,
                            totalComments: step.totalComments - 1
                        }))
                    };
                }
            });
        }
    });

    apw.comment.onAfterCommentCreate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is created, increment the "totalComments" count
         * of the corresponding step in the content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        const { id, stepId } = extractContentReviewIdAndStep(changeRequest.step);

        await updateContentReview({
            contentReviewMethods: apw.contentReview,
            id,
            getNewContentReviewData: data => {
                return {
                    ...data,
                    steps: updateContentReviewStep(data.steps, stepId, step => ({
                        ...step,
                        totalComments: step.totalComments + 1
                    }))
                };
            }
        });
    });
};

export const updateLatestCommentId = ({ apw }: LifeCycleHookCallbackParams) => {
    apw.comment.onAfterCommentCreate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is created, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        const { id } = extractContentReviewIdAndStep(changeRequest.step);

        await updateContentReview({
            contentReviewMethods: apw.contentReview,
            id,
            getNewContentReviewData: contentReview => {
                return {
                    ...contentReview,
                    latestCommentId: comment.id
                };
            }
        });
    });

    apw.comment.onAfterCommentUpdate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is updated, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const changeRequest = await apw.changeRequest.get(comment.changeRequest);

        const { id } = extractContentReviewIdAndStep(changeRequest.step);

        await updateContentReview({
            contentReviewMethods: apw.contentReview,
            id,
            getNewContentReviewData: contentReview => {
                return {
                    ...contentReview,
                    latestCommentId: comment.id
                };
            }
        });
    });
};
