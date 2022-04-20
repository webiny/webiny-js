import get from "lodash/get";
import Error from "@webiny/error";
import { ApwContentReviewStatus, ApwOnBeforePagePublishTopicParams } from "~/types";
import { ApwPageBuilderMethods, ApwPageBuilderPluginsParams } from ".";

interface TriggerContentReviewParams
    extends Pick<ApwPageBuilderPluginsParams, "apw">,
        Pick<ApwPageBuilderMethods, "onBeforePagePublish"> {}

export const triggerContentReview = ({ onBeforePagePublish, apw }: TriggerContentReviewParams) => {
    onBeforePagePublish.subscribe<ApwOnBeforePagePublishTopicParams>(async ({ page }) => {
        const contentReviewId = get(page, "settings.apw.contentReviewId");
        if (contentReviewId) {
            const contentReview = await apw.contentReview.get(contentReviewId);

            if (contentReview.status === ApwContentReviewStatus.UNDER_REVIEW) {
                throw new Error(
                    `A peer review for this content has been already requested.`,
                    "REVIEW_ALREADY_EXIST",
                    {
                        contentReviewId,
                        page
                    }
                );
            }
            return;
        }

        const workflowId = get(page, "settings.apw.workflowId");

        if (workflowId) {
            throw new Error(
                "This content requires peer review approval before it can be published.",
                "REVIEW_REQUIRED",
                {
                    workflowId,
                    page
                }
            );
        }
    });
};
