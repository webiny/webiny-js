import WebinyError from "@webiny/error";
import { ApwContext } from "~/types";
import { getAppUrl } from "./appUrl";
import { createContentReviewUrl } from "./contentReviewUrl";
import { createContentUrl } from "./contentUrl";
import { fetchReviewers } from "./reviewers";
import { sendContentReviewNotification } from "./sendContentReviewNotification";

export const attachContentReviewAfterCreate = (context: ApwContext): void => {
    context.apw.contentReview.onContentReviewAfterCreate.subscribe(async ({ contentReview }) => {
        if (contentReview.steps.length === 0) {
            return;
        }
        const [step] = contentReview.steps;
        if (!step?.id) {
            return;
        }
        const settings = await getAppUrl(context);
        if (!settings) {
            return;
        }

        const contentReviewUrl = createContentReviewUrl({
            baseUrl: settings.appUrl,
            contentReviewId: contentReview.id,
            stepId: step.id
        });
        if (!contentReviewUrl) {
            return;
        }

        /**
         * We go and check the workflow.
         */
        const workflow = await context.apw.workflow.get(contentReview.workflowId);
        if (!workflow) {
            throw new WebinyError(
                `There is no workflow with Id "${contentReview.workflowId}".`,
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
            exclude: [contentReview.createdBy.id]
        });
        if (reviewers.length === 0) {
            return;
        }

        try {
            await sendContentReviewNotification({
                context,
                reviewers,
                contentReview,
                workflow,
                contentReviewUrl,
                contentUrl
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not send content review notifications.`,
                "CONTENT_REVIEW_NOTIFICATIONS_NOT_SENT",
                {
                    workflowId: workflow.id,
                    contentReviewId: contentReview.id,
                    contentReviewUrl,
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
