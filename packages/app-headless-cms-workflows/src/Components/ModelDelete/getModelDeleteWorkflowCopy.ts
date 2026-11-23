import type { ModelDeleteWorkflowCopy } from "./ModelDeleteWorkflowCopy.js";
import type { ModelDeleteWorkflowCopyParams } from "./ModelDeleteWorkflowCopy.js";

// The copy of a model delete refused because a workflow uses the model (UI-18, QBZ-38). Pure.
export const getModelDeleteWorkflowCopy = (
    params: ModelDeleteWorkflowCopyParams
): ModelDeleteWorkflowCopy => {
    const { modelName, workflowName, canManage } = params;
    if (canManage) {
        return {
            title: null,
            body: `${modelName} has a workflow. Delete the workflow “${workflowName}” first, then delete the model.`,
            showLink: true
        };
    }
    return {
        title: `${modelName} has a workflow`,
        body: `Ask someone with Manage workflows to delete the workflow “${workflowName}” first, then delete the model.`,
        showLink: false
    };
};
