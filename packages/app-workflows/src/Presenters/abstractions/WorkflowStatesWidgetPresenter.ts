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
    showRejectDialog: IWorkflowState | null;
    showRejectSuccessDialog: IWorkflowState | null;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    approveState(state: IWorkflowState, comment?: string): Promise<void>;
    rejectState(state: IWorkflowState, comment: string): Promise<void>;
    showApproveStateDialog(state: IWorkflowState): void;
    showRejectStateDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
