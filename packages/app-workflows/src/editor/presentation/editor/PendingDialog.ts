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

// The conflict dialog's Reload: loads the draft's workflow again.
export interface ReloadAction {
    kind: "reload";
}

// The duplicate banner's Reload dialog: opens the workflow the model already has.
export interface ReloadDuplicateAction {
    kind: "reloadDuplicate";
    workflowId: string;
}

// The deleted dialog's primary button: the same id, a null `savedOn`.
export interface SaveAsNewAction {
    kind: "saveAsNew";
}

export interface DeleteWorkflowAction {
    kind: "deleteWorkflow";
}

// The blocked delete dialog has no primary button; Close is the secondary one.
export interface CloseAction {
    kind: "close";
}

export type PendingAction =
    | SwitchModelAction
    | RemoveStepAction
    | ReloadAction
    | ReloadDuplicateAction
    | SaveAsNewAction
    | DeleteWorkflowAction
    | CloseAction;

/*
 * The open dialog: its render-ready texts, built when it opened, and what its primary button does.
 * Private state of the presenter, never part of the VM.
 */
export interface PendingDialog {
    vm: WorkflowEditorDialogVm;
    action: PendingAction;
}
