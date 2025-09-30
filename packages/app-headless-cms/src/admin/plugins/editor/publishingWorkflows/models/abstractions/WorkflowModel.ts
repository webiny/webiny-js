import type { IWorkflow, IWorkflowStep } from "~/types.js";
import type { IWorkflowStepModel } from "./WorkflowStepModel.js";
import type { IObservableArray } from "mobx";

export interface IWorkflowModel extends IWorkflow {
    steps: IObservableArray<IWorkflowStepModel>;
    setSteps(steps: IWorkflowStep[]): void;
    addStep(step: IWorkflowStep): void;
    updateStep(step: IWorkflowStep): void;
    removeStep(id: string): void;
    findStep(id: string): IWorkflowStepModel | undefined;
    toJS(): IWorkflow;
}
