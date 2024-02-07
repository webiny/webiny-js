import WebinyError from "@webiny/error";
import { ApwContext } from "~/types";
import { extractContentReviewIdAndStep } from "~/plugins/utils";
import { createContentUrl } from "./contentUrl";
import { createCommentUrl } from "./commentUrl";
import { fetchReviewers } from "./reviewers";
import { sendCommentNotification } from "./sendCommentNotification";
import { getAppUrl } from "~/plugins/hooks/notifications/appUrl";

export const attachCommentAfterCreate = (context: ApwContext): void => {
    context.apw.comment.onCommentAfterCreate.subscribe(async ({ comment }) => {
        const changeRequest = await context.apw.changeRequest.get(comment.changeRequest);
        if (!changeRequest) {
            throw new WebinyError("Missing change request.", "CHANGE_REQUEST_NOT_FOUND", {
                changeRequest: comment.changeRequest,
                comment: comment.id
            });
        }

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
        const commentUrl = createCommentUrl({
            baseUrl: settings.appUrl,
            changeRequestId: changeRequest.id,
            contentReviewId,
            stepId
        });
        if (!commentUrl) {
            console.log("No comment url.");
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
            console.log("No content url.");
            return;
        }

        const reviewers = await fetchReviewers({
            context,
            workflow,
            exclude: [comment.createdBy.id]
        });

        if (reviewers.length === 0) {
            console.log("No reviewers to send the e-mail notification to.");
            return;
        }

        try {
            await sendCommentNotification({
                context,
                reviewers,
                changeRequest,
                contentReview,
                workflow,
                commentUrl,
                contentUrl
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not send comment notifications.`,
                "COMMENT_NOTIFICATIONS_NOT_SENT",
                {
                    commentId: comment.id,
                    workflowId: workflow.id,
                    changeRequestId: changeRequest.id,
                    contentReviewId,
                    commentUrl,
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
