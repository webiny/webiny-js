import type { IWorkflow, IWorkflowStep } from "~/types.js";
import type { IWorkflowStepModel } from "./WorkflowStepModel.js";

export interface IWorkflowModel extends IWorkflow {
    steps: IWorkflowStepModel[];
    setSteps(steps: IWorkflowStep[]): void;
    addStep(step: IWorkflowStep): void;
    updateStep(step: IWorkflowStep): void;
    removeStep(id: string): void;
    findStep(id: string): IWorkflowStepModel | undefined;
    toJS(): IWorkflow;
}
