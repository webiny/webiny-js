import get from "lodash/get";
import Error from "@webiny/error";
import {
    ApwContentTypes,
    ApwOnBeforePagePublishTopicParams,
    ApwOnBeforePageRequestReviewTopicParams
} from "~/types";
import { InitiateContentReviewParams } from ".";

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

    pageBuilder.onAfterPageRequestReview.subscribe<ApwOnBeforePageRequestReviewTopicParams>(
        async ({ page }) => {
            /*
             * TODO: @ashutosh add check to determine if a content review already exist for requested page.
             *  If it is so, terminate with an "ALREADY_EXISTS" error.
             */

            const contentReview = await apw.contentReview.create({
                content: {
                    id: page.id,
                    type: ApwContentTypes.PAGE,
                    settings: null
                }
            });
            /**
             * As we don't want the "RequestReview" process to continue,
             * we're using error in this lifecycle hook as a mechanism of flow control.
             */
            if (contentReview) {
                throw new Error(`A content review has been initiated for page "${page.id}"`);
            }
        }
    );
};
