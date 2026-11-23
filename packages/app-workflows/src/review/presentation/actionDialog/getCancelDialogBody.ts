import type { Review } from "~/review/domain/types.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";

/*
 * The body of the cancel dialog (QBZ-51): it names the review, with the design's suffix when the
 * current step is running and will be stopped (design 4c, frame 23). Pure.
 */
export const getCancelDialogBody = (review: Review): string => {
    const body = `Review progress on “${review.title}” is lost and editing is unlocked for the requester.`;
    const current = review.steps.find(step => step.id === review.currentStepId);
    if (current && isStepRunning(current)) {
        return `${body} ${current.title} is running and will be stopped.`;
    }
    return body;
};
