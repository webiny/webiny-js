import { WebinyError } from "@webiny/error";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

const message = "The workflow state is already in review and cannot proceed.";
const code = "Workflows/State/InReview";

export class WorkflowStateInReviewError extends WebinyError {
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
