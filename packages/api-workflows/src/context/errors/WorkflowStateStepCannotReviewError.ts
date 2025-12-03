import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecordStep } from "~/context/abstractions/WorkflowState.js";

const message = "You do not have permissions to review this workflow state step.";
const code = "Workflows/State/Step/CannotReview";

export class WorkflowStateStepCannotReviewError extends WebinyError {
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
