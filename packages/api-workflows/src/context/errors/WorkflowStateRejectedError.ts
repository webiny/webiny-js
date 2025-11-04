import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

const message = "Cannot perform this action on a workflow state that has been rejected.";
const code = "Workflows/State/Rejected";

export class WorkflowStateRejectedError extends WebinyError {
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
