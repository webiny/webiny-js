import type { IWorkflowStatesWidgetItem } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    loading: boolean;
    inReview: IWorkflowStatesWidgetItem[];
    approved: IWorkflowStatesWidgetItem[];
    rejected: IWorkflowStatesWidgetItem[];
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
}
