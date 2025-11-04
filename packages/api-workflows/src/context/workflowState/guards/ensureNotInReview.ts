import {
    type IWorkflowStateRecord,
    WorkflowStateRecordState
} from "~/context/abstractions/WorkflowState.js";
import { WorkflowStateInReviewError } from "~/context/errors/index.js";

export const ensureNotInReview = (state: IWorkflowStateRecord): void => {
    if (state.state !== WorkflowStateRecordState.inReview) {
        return;
    }
    throw new WorkflowStateInReviewError(state);
};
