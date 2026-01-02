import { type IWorkflowStateRecord, WorkflowStateRecordState } from "../abstractions.js";

export const isInReview = (state: IWorkflowStateRecord): boolean => {
    return state.state === WorkflowStateRecordState.inReview;
};
