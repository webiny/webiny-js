import type { IEnrichedWorkflowStateRecordStep } from "../abstractions.js";

export const isStepOwner = (step: IEnrichedWorkflowStateRecordStep): boolean => {
    return step.isOwner;
};
