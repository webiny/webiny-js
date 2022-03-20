import WebinyError from "@webiny/error";
import { LifeCycleHookCallbackParams } from "~/types";

export const validateContentReview = ({ apw }: Pick<LifeCycleHookCallbackParams, "apw">) => {
    apw.contentReview.onBeforeContentReviewCreate.subscribe(async ({ input }) => {
        const { content } = input;
        /**
         * Check whether a contentReview already exists for provided content.
         */
        const { contentReviewId } = await apw.contentReview.isReviewRequired(content);
        if (contentReviewId) {
            throw new WebinyError(
                `A peer review for this content has been already requested.`,
                "REVIEW_ALREADY_EXIST",
                {
                    contentReviewId,
                    content
                }
            );
        }
    });
};
