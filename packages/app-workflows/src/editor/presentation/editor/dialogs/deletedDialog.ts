import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface DeletedDialogParams {
    workflowName: string;
    modelName: string;
}

// QBZ-94 (supersedes D123's text): the primary button saves as new, the secondary discards.
export const deletedDialog = (params: DeletedDialogParams): WorkflowEditorDialogVm => {
    const name = params.workflowName.trim() === "" ? "this workflow" : params.workflowName;

    return {
        kind: "deleted",
        title: "This workflow was deleted",
        body: `“${name}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for ${params.modelName}, or discard them.`,
        note: null,
        reviews: [],
        confirmLabel: "Save as new workflow",
        cancelLabel: "Discard changes",
        destructive: false,
        cancelDestructive: true,
        busy: false
    };
};
