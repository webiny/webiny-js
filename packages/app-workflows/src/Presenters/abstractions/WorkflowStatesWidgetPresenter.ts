import type { IGenericError, IWorkflowState } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    error: IGenericError | null;
    dialogLoading: boolean;
    dialogError: IGenericError | null;
    inReview: IWorkflowState[];
    inReviewCount: number;
    pending: IWorkflowState[];
    pendingCount: number;
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
    showApproveStateStepDialog(state: IWorkflowState): void;
    showRejectStateStepDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
