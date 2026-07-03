import { WorkflowStateValue } from "~/types.js";
import type { TagProps } from "@webiny/admin-ui";

export const getTagStateVariant = (state: WorkflowStateValue): TagProps["variant"] => {
    switch (state) {
        case WorkflowStateValue.pending:
            return "neutral-base";
        case WorkflowStateValue.inReview:
            return "warning";
        case WorkflowStateValue.approved:
            return "success-light";
        case WorkflowStateValue.rejected:
            return "destructive";
        default:
            return "neutral-base";
    }
};
