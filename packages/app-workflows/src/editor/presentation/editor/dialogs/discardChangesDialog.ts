import type { WorkflowEditorDialogVm } from "../abstractions.js";

// R279, QBZ-17: shown when the admin leaves a dirty workflow through the model list.
export const discardChangesDialog = (workflowName: string): WorkflowEditorDialogVm => {
    const name = workflowName.trim() === "" ? "this workflow" : workflowName;

    return {
        kind: "discardChanges",
        icon: "warning",
        title: "Discard unsaved changes?",
        body: `You have unsaved changes to “${name}”. If you leave this workflow now, they are lost.`,
        note: null,
        reviews: [],
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
