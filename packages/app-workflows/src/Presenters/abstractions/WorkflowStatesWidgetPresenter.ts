import type { IGenericError, IWorkflowStatesWidgetItem } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    error: IGenericError | null;
    inReview: IWorkflowStatesWidgetItem[];
    inReviewTotalCount: number;
    approved: IWorkflowStatesWidgetItem[];
    approvedTotalCount: number;
    rejected: IWorkflowStatesWidgetItem[];
    rejectedTotalCount: number;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
}
