import { ApwContext } from "~/types";
import { getReviewers } from "./utils";

export const attachReviewerChanged = (context: ApwContext) => {
    context.apw.workflow.onWorkflowAfterUpdate.subscribe(async params => {
        const { workflow, original } = params;
        /**
         * First we need to get the list of reviewers. Let's have them mapped by entryId.
         */
        const originalReviewers = getReviewers(original);
        const currentReviewers = getReviewers(workflow);

        const removed: string[] = [];
        const added: string[] = [];
        /**
         * Then we need to find ones that are no longer in the workflow.
         */
        for (const id in originalReviewers) {
            const reviewer = originalReviewers[id];
            if (currentReviewers[reviewer.entryId]) {
                continue;
            }
            removed.push(reviewer.entryId);
        }
        /**
         * And then the ones that are newly added to the workflow.
         */
        for (const id in currentReviewers) {
            const reviewer = currentReviewers[id];
            if (originalReviewers[reviewer.entryId]) {
                continue;
            }
            added.push(reviewer.entryId);
        }
        /**
         * If there are no changes, no need to go further.
         */
        if (removed.length === 0 && added.length == 0) {
            return;
        }
        /**
         * Now we need to find ALL the content reviews which have
         */
        const contentReviews = await context.apw.contentReview.list({
            where: {
                workflowId: workflow.id
            }
        });
        /**
         * We need to send notifications to removed reviewers.
         */
        if (removed.length > 0) {
            await sendRemovedReviewersNotifications({
                removed,
                context
            });
        }
        /**
         * We need to send notifications to added reviewers.
         */
        if (added.length > 0) {
            await sendAddedReviewersNotifications({
                added,
                context
            });
        }
    });
};
