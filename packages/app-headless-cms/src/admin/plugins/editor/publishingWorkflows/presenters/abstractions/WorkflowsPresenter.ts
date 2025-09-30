import type { IWorkflow, IWorkflowStep } from "@webiny/app-headless-cms-common/types/index.js";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/index.js";

export interface IWorkflowsViewModel {
    workflow: IWorkflow;
}

export interface IWorkflowsPresenter {
    vm: IWorkflowsViewModel;
    setCurrentWorkflow(id: string): void;
    getWorkflow(): IWorkflowModel;
    updateWorkflow(workflow: IWorkflow): void;
    removeStep(step: Pick<IWorkflowStep, "id">): void;
    updateStep(step: IWorkflowStep): void;
    addStep(step: IWorkflowStep): void;
    canMoveStepUp(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepUp(step: Pick<IWorkflowStep, "id">): void;
    canMoveStepDown(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepDown(step: Pick<IWorkflowStep, "id">): void;
}
