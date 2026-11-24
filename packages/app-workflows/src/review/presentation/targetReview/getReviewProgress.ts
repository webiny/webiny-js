import type { Review } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewProgressVm } from "./abstractions.js";

// "n of N steps approved" (README 6).
export const getReviewProgress = (review: Review): TargetReviewProgressVm => {
    const approved = review.steps.filter(step => step.state === StepState.Approved).length;

    return { approved, total: review.steps.length };
};
