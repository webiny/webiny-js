import type { IEnrichedWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";
import { WorkflowStateStepCannotTakeOverError } from "~/context/errors/index.js";

export const ensureCanTakeOver = (step: IEnrichedWorkflowStateRecordStep): void => {
    if (step.canTakeOver) {
        return;
    }
    throw new WorkflowStateStepCannotTakeOverError(step);
};
