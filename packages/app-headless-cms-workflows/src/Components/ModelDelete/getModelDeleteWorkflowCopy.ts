import type { ModelDeleteWorkflowCopy } from "./ModelDeleteWorkflowCopy.js";
import type { ModelDeleteWorkflowCopyParams } from "./ModelDeleteWorkflowCopy.js";

// The copy of a model delete refused because a workflow uses the model (UI-18, QBZ-38). Pure.
export const getModelDeleteWorkflowCopy = (
    params: ModelDeleteWorkflowCopyParams
): ModelDeleteWorkflowCopy => {
    const { modelName, workflowName, canManage } = params;
    const title = `${modelName} has a workflow`;
    if (canManage) {
        return {
            title,
            body: `Delete the workflow “${workflowName}” first, then delete the model.`,
            showLink: true
        };
    }
    return {
        title,
        body: `Ask someone with Manage workflows to delete the workflow “${workflowName}” first, then delete the model.`,
        showLink: false
    };
};
