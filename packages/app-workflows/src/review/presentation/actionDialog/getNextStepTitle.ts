import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";

/*
 * The title of the step that is next after an approval, from the review the approval returned:
 * its current step, or `null` when that was the last step (QBZ-93: "Next: {step}." or "All steps
 * approved."). Pure.
 */
export const getNextStepTitle = (review: Review): string | null => {
    if (review.state === ReviewState.Approved || review.currentStepId === null) {
        return null;
    }
    const next = review.steps.find(step => step.id === review.currentStepId);
    if (!next) {
        return null;
    }
    return next.title;
};
