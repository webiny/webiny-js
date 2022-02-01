import get from "lodash/get";
import Error from "@webiny/error";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import {
    AdvancedPublishingWorkflow,
    ApwContentTypes,
    ApwOnBeforePagePublishTopicParams,
    ApwOnBeforePageRequestReviewTopicParams
} from "~/types";

interface InitiateContentReviewParams {
    pageBuilder: PageBuilderContextObject;
    apw: AdvancedPublishingWorkflow;
}

export default ({ pageBuilder, apw }: InitiateContentReviewParams) => {
    pageBuilder.onBeforePagePublish.subscribe<ApwOnBeforePagePublishTopicParams>(
        async ({ page }) => {
            const workflowId = get(page, "settings.apw.workflowId");

            if (workflowId) {
                throw new Error(
                    "This content requires peer review approval before it can be published",
                    "REVIEW_REQUIRED",
                    {
                        workflowId,
                        page
                    }
                );
            }
        }
    );

    pageBuilder.onBeforePageRequestReview.subscribe<ApwOnBeforePageRequestReviewTopicParams>(
        async ({ page }) => {
            const workflowId = get(page, "settings.apw.workflowId");

            const contentReview = await apw.contentReview.create({
                content: {
                    id: page.id,
                    type: ApwContentTypes.PAGE,
                    workflowId,
                    settings: null
                }
            });
            console.log(JSON.stringify({ contentReview }, null, 2));
            throw new Error("Test!");
        }
    );
};
