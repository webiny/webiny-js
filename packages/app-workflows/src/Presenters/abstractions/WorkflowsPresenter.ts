import type { IWorkflow, IWorkflowApplication, IWorkflowStep } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/index.js";
import type { IWorkflowModel } from "~/Models/index.js";

export interface IWorkflowsViewModel {
    dirty: boolean;
    workflows: IWorkflow[];
    workflow: IWorkflow | null;
    loading: boolean;
    error: IWorkflowError | null;
    app: IWorkflowApplication;
}

export interface IWorkflowsPresenter {
    vm: IWorkflowsViewModel;
    getWorkflow(): IWorkflowModel;
    updateWorkflow(workflow: IWorkflow): void;
    deleteWorkflow(workflow: IWorkflow): void;
    removeStep(step: Pick<IWorkflowStep, "id">): void;
    updateStep(step: IWorkflowStep): void;
    addStep(step: IWorkflowStep): void;
    canMoveStepUp(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepUp(step: Pick<IWorkflowStep, "id">): void;
    canMoveStepDown(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepDown(step: Pick<IWorkflowStep, "id">): void;
}
