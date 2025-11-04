import type { IEnrichedWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";
import { WorkflowStateStepNotStepOwnerError } from "~/context/errors/index.js";

export const ensureIsStepOwner = (step: IEnrichedWorkflowStateRecordStep): void => {
    if (step.isOwner) {
        return;
    }
    throw new WorkflowStateStepNotStepOwnerError(step);
};
