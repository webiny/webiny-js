import type { IWorkflowStep } from "~/types.js";
import type { IWorkflowModel } from "~/Models/index.js";

export interface IWorkflowsViewModel {
    workflow: IWorkflowModel;
    loading: boolean;
}

export interface IWorkflowsPresenter {
    vm: IWorkflowsViewModel;
    setCurrentWorkflow(id: string): void;
    getWorkflow(): IWorkflowModel;
    updateWorkflow(workflow: IWorkflowModel): void;
    removeStep(step: Pick<IWorkflowStep, "id">): void;
    updateStep(step: IWorkflowStep): void;
    addStep(step: IWorkflowStep): void;
    canMoveStepUp(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepUp(step: Pick<IWorkflowStep, "id">): void;
    canMoveStepDown(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepDown(step: Pick<IWorkflowStep, "id">): void;
}
