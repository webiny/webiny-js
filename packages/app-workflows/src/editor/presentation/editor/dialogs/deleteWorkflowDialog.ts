import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface DeleteWorkflowDialogParams {
    workflowName: string;
    modelName: string;
}

// QBZ-19.
export const deleteWorkflowDialog = (
    params: DeleteWorkflowDialogParams
): WorkflowEditorDialogVm => {
    return {
        kind: "deleteWorkflow",
        title: "Delete workflow?",
        body: `“${params.workflowName}” will be removed from ${params.modelName}. New revisions can then be published without a review. Finished reviews keep their history.`,
        note: null,
        reviews: [],
        confirmLabel: "Delete workflow",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
