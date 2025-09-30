import type { IWorkflow, IWorkflowStep } from "~/types.js";
import type { IWorkflowModel } from "../../models/index.js";

export interface IWorkflowsViewModel {
    setCurrentWorkflow(id: string): void;
    getWorkflow(): IWorkflowModel;
    updateWorkflow(workflow: IWorkflow): void;
    removeStep(step: Pick<IWorkflowStep, "id">): void;
    updateStep(step: IWorkflowStep): void;
    addStep(step: IWorkflowStep): void;
}

export interface IWorkflowsPresenter {
    vm: IWorkflowsViewModel;
}
