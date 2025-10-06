import type { IWorkflowStep } from "~/types.js";
import type { IWorkflowModel } from "~/Models/index.js";
import type { IWorkflowError } from "~/Gateways/index.js";

export interface IWorkflowsViewModel {
    dirty: boolean;
    workflow: IWorkflowModel;
    loading: boolean;
    error: IWorkflowError | null;
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
