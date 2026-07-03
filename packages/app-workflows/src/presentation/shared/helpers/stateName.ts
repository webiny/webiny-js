import { WorkflowStateValue } from "~/types.js";

export const getStateName = (state: WorkflowStateValue): string => {
    switch (state) {
        case WorkflowStateValue.pending:
            return "Pending";
        case WorkflowStateValue.inReview:
            return "In Review";
        case WorkflowStateValue.approved:
            return "Approved";
        case WorkflowStateValue.rejected:
            return "Rejected";
        default:
            return state;
    }
};
