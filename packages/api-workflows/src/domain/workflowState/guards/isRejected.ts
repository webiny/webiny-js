import { type IWorkflowStateRecord, WorkflowStateRecordState } from "../abstractions.js";

export const isRejected = (state: IWorkflowStateRecord): boolean => {
    return state.state === WorkflowStateRecordState.rejected;
};
