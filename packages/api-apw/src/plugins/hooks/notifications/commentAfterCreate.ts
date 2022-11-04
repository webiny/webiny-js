import WebinyError from "@webiny/error";
import { ApwContext } from "~/types";
import { createCommentUrl, getReviewers } from "./utils";
import { extractContentReviewIdAndStep } from "~/plugins/utils";
import { sendCommentNotification } from "./comment/sendCommentNotification";

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
        /**
         * We will check if we can create a comment url before we go digging further into the database.
         */
        const commentUrl = createCommentUrl({
            baseUrl: process.env.APP_URL,
            changeRequestId: changeRequest.id,
            contentReviewId,
            stepId
        });
        if (!commentUrl) {
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
                `There is no workflow with stepId "${stepId}".`,
                "WORKFLOW_NOT_FOUND",
                {
                    stepId
                }
            );
        }

        const reviewers = Object.values(
            getReviewers({
                steps: workflow.steps
            })
        );

        if (reviewers.length === 0) {
            return;
        }

        try {
            await sendCommentNotification({
                context,
                reviewers,
                changeRequest,
                contentReview,
                workflow,
                commentUrl
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
