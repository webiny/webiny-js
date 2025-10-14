import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
import { STATE_MODEL_ID } from "~/constants.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

const stateField: CmsModelField = {
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

export const createStateModel = () => {
    return createPrivateModelPlugin({
        modelId: STATE_MODEL_ID,
        name: "RecordWorkflow State",
        fields: [
            {
                fieldId: "workflowId",
                id: "workflowId",
                storageId: "text@workflowId",
                type: "text",
                label: "Workflow ID"
            },
            {
                fieldId: "app",
                id: "app",
                storageId: "text@app",
                type: "text",
                label: "App"
            },
            {
                fieldId: "targetRevisionId",
                id: "targetRevisionId",
                storageId: "text@targetRevisionId",
                type: "text",
                label: "Target Revision ID"
            },
            {
                fieldId: "targetId",
                id: "targetId",
                storageId: "text@targetId",
                type: "text",
                label: "Target ID"
            },
            {
                fieldId: "comment",
                id: "comment",
                storageId: "text@comment",
                type: "text",
                label: "Comment"
            },
            stateField,
            {
                fieldId: "steps",
                id: "steps",
                storageId: "object@steps",
                type: "object",
                label: "Steps",
                multipleValues: true,
                settings: {
                    fields: [
                        {
                            id: "id",
                            type: "text",
                            fieldId: "id",
                            storageId: "text@id",
                            label: "Step ID"
                        },
                        stateField,
                        {
                            id: "userId",
                            type: "text",
                            fieldId: "userId",
                            storageId: "text@userId",
                            label: "User ID"
                        },
                        {
                            fieldId: "comment",
                            id: "comment",
                            storageId: "text@comment",
                            type: "text",
                            label: "Comment"
                        }
                    ]
                }
            }
        ]
    });
};
