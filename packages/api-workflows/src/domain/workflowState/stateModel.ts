import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
// TODO: move to `domain`
import {
    createAppField,
    createCommentField,
    createSavedByField,
    createStateField,
    createStepsField,
    createTitleField
} from "../../context/models/fields/index.js";

export const WORKFLOW_STATE_MODEL_ID = "workflowState";

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
            createTitleField(),
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
            /**
             * We need to extend the base steps field with additional fields required for workflow state.
             */
            createStepsField({
                settings: {
                    fields: [createStateField(), createSavedByField(), createCommentField()]
                }
            })
        ]
    });
};
