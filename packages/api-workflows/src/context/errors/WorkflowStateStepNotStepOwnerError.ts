import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";

const message = "You must be the owner of this workflow state step to perform this action.";
const code = "Workflows/State/Step/NotStepOwner";

export class WorkflowStateStepNotStepOwnerError extends WebinyError {
    public constructor(step: IWorkflowStateRecordStep) {
        super({
            message,
            code,
            data: {
                step
            }
        });
    }
}
