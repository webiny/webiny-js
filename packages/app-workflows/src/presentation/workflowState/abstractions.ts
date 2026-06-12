import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflow, IWorkflowState, IWorkflowStateStep } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowStateErrorDataInvalidFieldData {
    path: NonEmptyArray<string>;
}

export interface IWorkflowStateErrorDataInvalidField {
    code: string;
    message: string;
    data: IWorkflowStateErrorDataInvalidFieldData;
}

export interface IWorkflowStateErrorDataInvalidFields {
    [key: string]: IWorkflowStateErrorDataInvalidField;
}

export interface IWorkflowStateErrorData {
    invalidFields: IWorkflowStateErrorDataInvalidFields;
}

export interface IWorkflowStateError {
    code: string | null;
    message: string;
    data?: IWorkflowStateErrorData;
    stack?: string;
}

export interface IWorkflowStatePresenterViewModelDialog {
    type:
        | "cancelReview"
        | "requestReview"
        | "start"
        | "start:success"
        | "approve"
        | "approve:success"
        | "reject"
        | "reject:success"
        | "comment"
        | "takeOver"
        | "takeOver:success";
    step?: IWorkflowStateStep | null;
}

export interface IWorkflowStatePresenterViewModel {
    id: string;
    app: string;
    loading: boolean;
    workflow: IWorkflow | null;
    error: IWorkflowStateError | null;
    state: IWorkflowState | null | undefined;
    step: IWorkflowStateStep | null | undefined;
    lastApprovedStep: IWorkflowStateStep | null;
    lastRejectedStep: IWorkflowStateStep | null;
    nextStep: IWorkflowStateStep | null;
    canCancel: boolean;
    dialog: IWorkflowStatePresenterViewModelDialog | null;
}

export interface IWorkflowStatePresenter {
    vm: IWorkflowStatePresenterViewModel;
    init(app: string, targetRevisionId: string, title: string): Promise<void>;
    dispose(): void;
    requestReview(): Promise<void>;
    hideDialog(): void;
    showCancelReviewDialog(): void;
    showRequestReviewDialog(): void;
    showStartDialog(): void;
    showApproveDialog(): void;
    showRejectDialog(): void;
    showCommentDialog(id: string): void;
    showTakeOverDialog(): void;
    start(): Promise<void>;
    approve(comment?: string): Promise<void>;
    reject(comment: string): Promise<void>;
    cancel(): Promise<void>;
    takeOver(): Promise<void>;
}

export const WorkflowStatePresenter =
    createAbstraction<IWorkflowStatePresenter>("WorkflowStatePresenter");

export namespace WorkflowStatePresenter {
    export type Interface = IWorkflowStatePresenter;
    export type ViewModel = IWorkflowStatePresenterViewModel;
}
