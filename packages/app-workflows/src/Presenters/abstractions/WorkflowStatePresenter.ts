import type { IWorkflow, IWorkflowState, IWorkflowStateStep } from "~/types.js";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";

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
    requestReview(): void;
    hideDialog(): void;
    showCancelReviewDialog(): void;
    showRequestReviewDialog(): void;
    showStartDialog(): void;
    showApproveDialog(): void;
    showRejectDialog(): void;
    showCommentDialog(id: string): void;
    showTakeOverDialog(): void;
    start(): void;
    approve(comment?: string): void;
    reject(comment: string): void;
    cancel(): void;
    takeOver(): void;
}
