import type { Review } from "~/review/domain/types.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";

const CANCEL_BODY =
    "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

/*
 * The body of the cancel dialog (QBZ-51): the 8a text, with the design's suffix when the current
 * step is running and will be stopped (design 4c, frame 23). Pure.
 */
export const getCancelDialogBody = (review: Review): string => {
    const current = review.steps.find(step => step.id === review.currentStepId);
    if (current && isStepRunning(current)) {
        return `${CANCEL_BODY} ${current.title} is running and will be stopped.`;
    }
    return CANCEL_BODY;
};
