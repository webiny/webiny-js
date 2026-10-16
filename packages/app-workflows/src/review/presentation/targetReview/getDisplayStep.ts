import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";

export interface DisplayStep {
    step: ReviewStep;
    index: number;
    total: number;
}

/*
 * The step the bar describes: the current step; for a finished review the rejecting step or the
 * last step (QBZ-52, QBZ-70).
 */
export const getDisplayStep = (review: Review): DisplayStep | null => {
    const steps = review.steps;
    if (steps.length === 0) {
        return null;
    }

    let index = -1;
    if (review.currentStepId !== null) {
        index = steps.findIndex(step => step.id === review.currentStepId);
    }
    if (index === -1 && review.state === ReviewState.Rejected) {
        index = steps.findIndex(step => step.state === StepState.Rejected);
    }
    if (index === -1 && review.state === ReviewState.Approved) {
        index = steps.length - 1;
    }
    if (index === -1) {
        index = steps.findIndex(step => step.state !== StepState.Approved);
    }
    if (index === -1) {
        index = steps.length - 1;
    }

    return { step: steps[index], index, total: steps.length };
};
