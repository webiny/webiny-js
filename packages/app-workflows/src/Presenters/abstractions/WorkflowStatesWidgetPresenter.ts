import type { IGenericError, IWorkflowState } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    type: "own" | "requested";
    loading: boolean;
    error: IGenericError | null;
    dialogLoading: boolean;
    dialogError: IGenericError | null;
    pending: IWorkflowState[];
    pendingCount: number;
    inReview: IWorkflowState[];
    inReviewCount: number;
    approved: IWorkflowState[];
    approvedCount: number;
    rejected: IWorkflowState[];
    rejectedCount: number;
    showStartDialog: IWorkflowState | null;
    showStartSuccessDialog: IWorkflowState | null;
    showApproveDialog: IWorkflowState | null;
    showApproveSuccessDialog: IWorkflowState | null;
    showRejectDialog: IWorkflowState | null;
    showRejectSuccessDialog: IWorkflowState | null;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    startStateStep(state: IWorkflowState): Promise<void>;
    approveStateStep(state: IWorkflowState, comment?: string): Promise<void>;
    rejectStateStep(state: IWorkflowState, comment: string): Promise<void>;
    showStartStateStepDialog(state: IWorkflowState): void;
    showApproveStateStepDialog(state: IWorkflowState): void;
    showRejectStateStepDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
