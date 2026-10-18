import type { WorkflowEditorDialogVm } from "./abstractions.js";

// Leaving a dirty draft for another model (R279).
export interface SwitchModelAction {
    kind: "switchModel";
    modelId: string;
}

// Task 9b and Task 10 add the actions of the step, save and delete dialogs here.
export type PendingAction = SwitchModelAction;

/*
 * The open dialog: its render-ready texts, built when it opened, and what its primary button does.
 * Private state of the presenter, never part of the VM.
 */
export interface PendingDialog {
    vm: WorkflowEditorDialogVm;
    action: PendingAction;
}
