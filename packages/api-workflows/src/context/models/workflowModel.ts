import { createPrivateModelPlugin } from "@webiny/api-headless-cms";
import { WORKFLOW_MODEL_ID } from "~/constants.js";
import { createAppField, createStepsField } from "./fields/index.js";

export const createWorkflowModel = () => {
    return createPrivateModelPlugin({
        modelId: WORKFLOW_MODEL_ID,
        name: "Workflow",
        fields: [
            {
                id: "name",
                type: "text",
                storageId: "text@name",
                fieldId: "name",
                label: "Name",
                validation: [
                    {
                        name: "required",
                        message: "Workflow name is required."
                    }
                ]
            },
            createAppField(),
            createStepsField()
        ]
    });
};
