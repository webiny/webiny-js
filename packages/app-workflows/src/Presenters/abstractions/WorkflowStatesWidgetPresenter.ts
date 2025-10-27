import type { IWorkflowStatesWidgetItem } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    inReview: IWorkflowStatesWidgetItem[];
    approved: IWorkflowStatesWidgetItem[];
    rejected: IWorkflowStatesWidgetItem[];
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
}
