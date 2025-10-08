import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
import { STATE_MODEL_ID } from "~/constants.js";

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
                        {
                            id: "status",
                            type: "text",
                            fieldId: "status",
                            storageId: "text@status",
                            label: "Status",
                            predefinedValues: {
                                enabled: true,
                                values: [
                                    {
                                        label: "Pending",
                                        value: "pending"
                                    },
                                    {
                                        label: "Approved",
                                        value: "approved"
                                    },
                                    {
                                        label: "Rejected",
                                        value: "rejected"
                                    }
                                ]
                            }
                        },
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
