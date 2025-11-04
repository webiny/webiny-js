import {
    type IWorkflowStateRecord,
    WorkflowStateRecordState
} from "~/context/abstractions/WorkflowState.js";
import { WorkflowStateRejectedError } from "~/context/errors/index.js";

export const ensureNotRejected = (state: IWorkflowStateRecord): void => {
    if (state.state !== WorkflowStateRecordState.rejected) {
        return;
    }
    throw new WorkflowStateRejectedError(state);
};
