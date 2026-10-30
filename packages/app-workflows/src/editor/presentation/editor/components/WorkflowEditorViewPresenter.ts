import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";

/*
 * The part of the editor presenter the layout reads and calls (Tasks 15-19). `WorkflowEditorView`
 * passes the resolved `WorkflowEditorPresenter.Interface` here, so a missing or renamed member is
 * a type error on that line. Tests build fakes against this type.
 */
export type WorkflowEditorViewPresenter = Pick<
    WorkflowEditorPresenter.Interface,
    | "vm"
    | "retry"
    | "retryModels"
    | "retryOptions"
    | "setSearch"
    | "loadMore"
    | "selectModel"
    | "createWorkflow"
    | "setName"
    | "save"
    | "retrySave"
    | "dismissBanner"
    | "reloadDuplicate"
    | "requestDelete"
    | "openTypePicker"
    | "closeTypePicker"
    | "addStep"
    | "moveStep"
    | "requestDeleteStep"
    | "confirmDialog"
    | "openStep"
    | "closeStep"
    | "cancelDialog"
>;
