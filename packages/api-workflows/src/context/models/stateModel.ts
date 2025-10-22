import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
import { WORKFLOW_STATE_MODEL_ID } from "~/constants.js";
import {
    createAppField,
    createSavedByField,
    createStateField,
    createStepsField
} from "~/context/models/fields/index.js";
import { createCommentField } from "~/context/models/fields/comment.js";

export const createWorkflowStateModel = () => {
    return createPrivateModelPlugin({
        modelId: WORKFLOW_STATE_MODEL_ID,
        name: "RecordWorkflow State",
        fields: [
            {
                fieldId: "workflowId",
                id: "workflowId",
                storageId: "text@workflowId",
                type: "text",
                label: "Workflow ID"
            },
            createAppField(),
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
                fieldId: "isActive",
                type: "boolean",
                id: "isActive",
                storageId: "boolean@isActive",
                label: "Is Active"
            },
            createCommentField(),
            createStateField(),
            createStepsField({
                settings: {
                    fields: [createStateField(), createSavedByField(), createCommentField()]
                }
            })
        ]
    });
};
