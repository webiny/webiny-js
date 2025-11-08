import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";

const message = "You do not have permissions to take over this workflow state step.";
const code = "Workflows/State/Step/CannotTakeOver";

export class WorkflowStateStepCannotTakeOverError extends WebinyError {
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
