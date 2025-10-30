import type { IGenericError, IWorkflowState } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    error: IGenericError | null;
    dialogLoading: boolean;
    dialogError: IGenericError | null;
    inReview: IWorkflowState[];
    inReviewCount: number;
    approved: IWorkflowState[];
    approvedCount: number;
    rejected: IWorkflowState[];
    rejectedCount: number;
    showApproveDialog: IWorkflowState | null;
    showApproveSuccessDialog: IWorkflowState | null;
    showDeclineDialog: IWorkflowState | null;
    showDeclineSuccessDialog: IWorkflowState | null;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    approveState(state: IWorkflowState, comment?: string): Promise<void>;
    declineState(state: IWorkflowState, comment: string): Promise<void>;
    showApproveStateDialog(state: IWorkflowState): void;
    showDeclineStateDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
