import type { IWorkflowStatesWidgetItem } from "~/types.js";

export interface IWorkflowStatesWidgetPresenterViewModel {
    inReview: IWorkflowStatesWidgetItem[];
    approved: IWorkflowStatesWidgetItem[];
    declined: IWorkflowStatesWidgetItem[];
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
}
