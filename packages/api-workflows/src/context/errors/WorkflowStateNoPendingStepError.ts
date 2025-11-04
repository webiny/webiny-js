import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

const message = "The workflow state has no pending step to proceed.";
const code = "Workflows/State/NoPendingStep";

export class WorkflowStateNoPendingStepError extends WebinyError {
    public constructor(state: IWorkflowStateRecord) {
        super({
            message,
            code,
            data: {
                state
            }
        });
    }
}
