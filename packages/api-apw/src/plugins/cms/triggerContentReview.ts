import Error from "@webiny/error";
import { ApwContentReviewStatus, ApwContext, OnBeforeCmsEntryPublishTopicParams } from "~/types";

export const triggerContentReview = ({ cms, apw }: ApwContext) => {
    cms.onBeforeEntryPublish.subscribe<OnBeforeCmsEntryPublishTopicParams>(async ({ entry }) => {
        const contentReviewId = entry.meta?.apw?.contentReviewId;
        if (contentReviewId) {
            const contentReview = await apw.contentReview.get(contentReviewId);

            if (contentReview.status !== ApwContentReviewStatus.UNDER_REVIEW) {
                return;
            }
            throw new Error(
                `A peer review for this content has been already requested.`,
                "REVIEW_ALREADY_EXIST",
                {
                    contentReviewId,
                    entry
                }
            );
        }

        const workflowId = entry.meta?.apw?.workflowId;

        if (!workflowId) {
            return;
        }
        throw new Error(
            "This content requires peer review approval before it can be published.",
            "REVIEW_REQUIRED",
            {
                workflowId,
                entry
            }
        );
    });
};
