import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import type { ReviewData } from "./types.js";

/**
 * Where an in-progress review stands, for the delete-blocked error (D115). An in-progress review
 * always has a current step; the first step is the fallback for corrupt data. Pure.
 */
export const toBlockingReview = (review: ReviewData): WorkflowBlockingReview => {
    const index = review.steps.findIndex(step => step.id === review.currentStepId);
    const position = index === -1 ? 1 : index + 1;
    const step = review.steps[position - 1];
    return {
        reviewId: review.id,
        model: review.model,
        targetId: review.targetId,
        targetRevisionId: review.targetRevisionId,
        title: review.title,
        stepPosition: position,
        stepCount: review.steps.length,
        stepName: step?.title ?? ""
    };
};
