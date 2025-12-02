import type { IEnrichedWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";
import { WorkflowStateStepCannotReviewError } from "~/context/errors/index.js";

export const ensureCanReview = (step: IEnrichedWorkflowStateRecordStep): void => {
    if (step.canReview) {
        return;
    }
    throw new WorkflowStateStepCannotReviewError(step);
};
