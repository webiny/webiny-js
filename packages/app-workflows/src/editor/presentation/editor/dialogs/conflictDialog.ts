import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface ConflictDialogParams {
    // The display name of whoever saved the newer version, `Someone` when unknown (Q43).
    savedByName: string;
    workflowName: string;
}

// D131: the draft is kept; reloading replaces it.
export const conflictDialog = (params: ConflictDialogParams): WorkflowEditorDialogVm => {
    const name = params.workflowName.trim() === "" ? "this workflow" : params.workflowName;

    return {
        kind: "conflict",
        title: "Someone else changed this workflow",
        body: `${params.savedByName} saved a newer version of “${name}” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.`,
        note: null,
        reviews: [],
        confirmLabel: "Reload workflow",
        cancelLabel: "Keep editing",
        destructive: false,
        cancelDestructive: false,
        busy: false
    };
};
