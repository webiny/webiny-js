import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface ReloadWorkflowDialogParams {
    modelName: string;
    workflowName: string;
}

// QBZ-18: opened by the duplicate banner's Reload.
export const reloadWorkflowDialog = (
    params: ReloadWorkflowDialogParams
): WorkflowEditorDialogVm => {
    return {
        kind: "reloadWorkflow",
        icon: "refresh",
        title: "Reload workflow?",
        body: `Your unsaved draft for ${params.modelName} is lost, and the existing workflow “${params.workflowName}” opens.`,
        note: null,
        reviews: [],
        confirmLabel: "Reload",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
