import type { IEnrichedWorkflowStateRecordStep } from "../abstractions.js";

export const canTakeOver = (step: IEnrichedWorkflowStateRecordStep): boolean => {
    return step.canTakeOver;
};
