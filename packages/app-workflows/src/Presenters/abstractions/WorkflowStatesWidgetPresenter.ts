import type { IGenericError, IWorkflowState } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    error: IGenericError | null;
    inReview: IWorkflowState[];
    inReviewTotalCount: number;
    approved: IWorkflowState[];
    approvedTotalCount: number;
    rejected: IWorkflowState[];
    rejectedTotalCount: number;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
}
