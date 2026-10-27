import type { WorkflowEditorDialogVm } from "../abstractions.js";

// The step is only removed from the draft; the workflow changes when it is saved.
export const deleteStepDialog = (stepTitle: string): WorkflowEditorDialogVm => {
    const title = stepTitle.trim() === "" ? "Untitled step" : stepTitle;

    return {
        kind: "deleteStep",
        title: "Delete step?",
        body: `“${title}” is removed from this workflow when you save. Reviews already running are not affected.`,
        note: null,
        reviews: [],
        confirmLabel: "Delete step",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
