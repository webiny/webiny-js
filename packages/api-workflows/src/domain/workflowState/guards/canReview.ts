import type { IEnrichedWorkflowStateRecordStep } from "../abstractions.js";

export const canReview = (step: IEnrichedWorkflowStateRecordStep): boolean => {
    return step.canReview;
};
