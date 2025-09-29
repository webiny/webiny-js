import type { IWorkflow } from "~/types.js";

export interface IWorkflowsViewModel extends IWorkflow {
    // TODO determine properties
    some: string;
}

export interface IWorkflowsPresenter {
    vm: IWorkflowsViewModel;
}
