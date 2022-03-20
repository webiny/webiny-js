import { LifeCycleHookCallbackParams } from "~/types";
import {
    extractContentReviewIdAndStep,
    safelyGetContentReview,
    updateContentReview,
    updateContentReviewStep
} from "../utils";

export const updateTotalCommentsCount = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.comment.onAfterCommentDelete.subscribe(async ({ comment }) => {
        const { step } = comment;
        /**
         * After a "comment" is deleted, decrement the "totalComments" count
         * in the corresponding step of the content review entry.
         */
        if (step) {
            const { id, stepId } = extractContentReviewIdAndStep(step);

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
        const { id, stepId } = extractContentReviewIdAndStep(comment.step);

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

export const updateLatestCommentId = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.comment.onAfterCommentCreate.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is created, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const { id } = extractContentReviewIdAndStep(comment.step);

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
        const { id } = extractContentReviewIdAndStep(comment.step);

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

    apw.comment.onAfterCommentDelete.subscribe(async ({ comment }) => {
        /**
         * After a "comment" is updated, update the "latestCommentId" in
         *  the corresponding content review entry.
         */
        const { id } = extractContentReviewIdAndStep(comment.step);

        const contentReview = await safelyGetContentReview({
            id,
            contentReviewMethods: apw.contentReview
        });

        if (contentReview && contentReview.latestCommentId === comment.id) {
            const [[latestComment]] = await apw.comment.list({
                where: { changeRequest: { id: comment.changeRequest } },
                sort: ["createdOn_DESC"]
            });

            await updateContentReview({
                contentReviewMethods: apw.contentReview,
                id,
                getNewContentReviewData: contentReview => {
                    return {
                        ...contentReview,
                        latestCommentId: latestComment ? latestComment.id : null
                    };
                }
            });
        }
    });
};
