import get from "lodash/get";
import Error from "@webiny/error";
import {
    AdvancedPublishingWorkflow,
    ApwContentReviewStatus,
    ApwOnBeforePagePublishTopicParams
} from "~/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";

interface TriggerContentReviewParams {
    apw: AdvancedPublishingWorkflow;
    pageBuilder: PageBuilderContextObject;
}

export const triggerContentReview = (params: TriggerContentReviewParams) => {
    const { pageBuilder, apw } = params;

    pageBuilder.onBeforePagePublish.subscribe<ApwOnBeforePagePublishTopicParams>(
        async ({ page }) => {
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
        }
    );
};
