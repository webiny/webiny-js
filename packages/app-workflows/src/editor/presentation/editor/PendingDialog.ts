import type { WorkflowEditorDialogVm } from "./abstractions.js";

// Leaving a dirty draft for another model (R279).
export interface SwitchModelAction {
    kind: "switchModel";
    modelId: string;
}

export interface RemoveStepAction {
    kind: "removeStep";
    stepId: string;
}

// Task 10 adds the actions of the save and delete dialogs here.
export type PendingAction = SwitchModelAction | RemoveStepAction;

/*
 * The open dialog: its render-ready texts, built when it opened, and what its primary button does.
 * Private state of the presenter, never part of the VM.
 */
export interface PendingDialog {
    vm: WorkflowEditorDialogVm;
    action: PendingAction;
}
