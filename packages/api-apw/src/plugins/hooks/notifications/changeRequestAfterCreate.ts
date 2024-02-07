import WebinyError from "@webiny/error";
import { ApwContext } from "~/types";
import { extractContentReviewIdAndStep } from "~/plugins/utils";
import { createContentUrl } from "./contentUrl";
import { sendChangeRequestNotification } from "./sendChangeRequestNotification";
import { fetchReviewers } from "./reviewers";
import { createChangeRequestUrl } from "./changeRequestUrl";
import { getAppUrl } from "~/plugins/hooks/notifications/appUrl";

export const attachChangeRequestAfterCreate = (context: ApwContext): void => {
    context.apw.changeRequest.onChangeRequestAfterCreate.subscribe(async ({ changeRequest }) => {
        const { id: contentReviewId, stepId } = extractContentReviewIdAndStep(changeRequest.step);
        if (!stepId) {
            throw new WebinyError("Malformed changeRequest.step value.", "MALFORMED_VALUE", {
                step: changeRequest.step
            });
        }

        const settings = await getAppUrl(context);
        if (!settings) {
            return;
        }
        /**
         * We will check if we can create a comment url before we go digging further into the database.
         */
        const changeRequestUrl = createChangeRequestUrl({
            baseUrl: settings.appUrl,
            changeRequestId: changeRequest.id,
            contentReviewId,
            stepId
        });
        if (!changeRequestUrl) {
            return;
        }
        /**
         * Let's see if content review exists.
         */
        const contentReview = await context.apw.contentReview.get(contentReviewId);
        if (!contentReview) {
            throw new WebinyError(
                `There is no contentReview with id "${contentReviewId}".`,
                "CONTENT_REVIEW_NOT_FOUND",
                {
                    contentReviewId
                }
            );
        }
        /**
         * We go and check the workflow.
         */
        const workflow = await context.apw.workflow.get(contentReview.workflowId);
        if (!workflow) {
            throw new WebinyError(
                `There is no workflow with workflowId "${contentReview.workflowId}".`,
                "WORKFLOW_NOT_FOUND",
                {
                    workflowId: contentReview.workflowId
                }
            );
        }

        const contentUrl = createContentUrl({
            plugins: context.plugins,
            baseUrl: settings.appUrl,
            contentReview,
            workflow
        });
        if (!contentUrl) {
            return;
        }

        const reviewers = await fetchReviewers({
            context,
            workflow,
            exclude: [changeRequest.createdBy.id]
        });
        if (reviewers.length === 0) {
            return;
        }

        try {
            await sendChangeRequestNotification({
                context,
                reviewers,
                changeRequest,
                contentReview,
                workflow,
                changeRequestUrl,
                contentUrl
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not send change request notifications.`,
                "CHANGE_REQUEST_NOTIFICATIONS_NOT_SENT",
                {
                    workflowId: workflow.id,
                    changeRequestId: changeRequest.id,
                    contentReviewId,
                    changeRequestUrl,
                    contentUrl,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data,
                        stack: ex.stack
                    }
                }
            );
        }
    });
};
