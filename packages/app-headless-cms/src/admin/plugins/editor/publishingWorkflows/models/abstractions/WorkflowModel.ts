import type { IWorkflow, IWorkflowStep } from "~/types.js";
import type { IWorkflowStepModel } from "./WorkflowStepModel.js";

export interface IWorkflowModel extends IWorkflow {
    steps: IWorkflowStepModel[];
    addStep(step: IWorkflowStep): void;
    removeStep(id: string): void;
    findStep(id: string): IWorkflowStepModel | undefined;
}
