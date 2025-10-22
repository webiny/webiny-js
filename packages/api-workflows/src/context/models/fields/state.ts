import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

export const createStateField = (): CmsModelField => {
    return {
        id: "state",
        type: "text",
        fieldId: "state",
        storageId: "text@state",
        label: "State",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    label: "Pending",
                    value: WorkflowStateRecordState.pending
                },
                {
                    label: "In Review",
                    value: WorkflowStateRecordState.inReview
                },
                {
                    label: "Approved",
                    value: WorkflowStateRecordState.approved
                },
                {
                    label: "Rejected",
                    value: WorkflowStateRecordState.rejected
                }
            ]
        }
    };
}
