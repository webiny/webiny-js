import { ReviewState } from "./ReviewState.js";
import type { ReviewStateValue } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import type { StepStateValue } from "./StepState.js";
import type { Review } from "./types.js";
import type { SystemWorkflowValue } from "./types.js";

const deriveReviewState = (stepState: StepStateValue): ReviewStateValue => {
    if (stepState === StepState.Rejected) {
        return ReviewState.Rejected;
    }
    if (stepState === StepState.Approved) {
        return ReviewState.Approved;
    }
    return ReviewState.InProgress;
};

/*
 * The `meta.system.workflow` value of a target revision, mirror of `Review.getSystemWorkflow()` in
 * api-workflows: `null` for no review or a cancelled one (D75); the current step is the first step
 * that is not approved (`findCurrentStep`), else the last step; the review state follows that step.
 */
export const toSystemWorkflow = (review: Review | null): SystemWorkflowValue | null => {
    if (!review || review.state === ReviewState.Cancelled) {
        return null;
    }
    const current =
        review.steps.find(step => step.state !== StepState.Approved) ?? review.steps.at(-1);
    if (!current) {
        return null;
    }
    return {
        workflowId: review.workflowId,
        reviewState: deriveReviewState(current.state),
        stepId: current.id,
        stepName: current.title,
        stepState: current.state
    };
};
