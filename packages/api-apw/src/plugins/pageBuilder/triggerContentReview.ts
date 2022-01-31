import get from "lodash/get";
import Error from "@webiny/error";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { ApwOnBeforePagePublishTopicParams } from "~/types";

interface InitiateContentReviewParams {
    pageBuilder: PageBuilderContextObject;
}

export default ({ pageBuilder }: InitiateContentReviewParams) => {
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
};
