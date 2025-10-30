import type { IGenericError, IWorkflowState } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    error: IGenericError | null;
    inReview: IWorkflowState[];
    inReviewCount: number;
    approved: IWorkflowState[];
    approvedCount: number;
    rejected: IWorkflowState[];
    rejectedCount: number;
    showApproveDialog: boolean;
    showApproveSuccessDialog: boolean;
    showDeclineDialog: boolean;
    showDeclineSuccessDialog: boolean;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    approveState(state: IWorkflowState, comment?: string): Promise<void>;
    declineState(state: IWorkflowState, comment: string): Promise<void>;
    showApproveStateDialog(state: IWorkflowState): void;
    showDeclineStateDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
