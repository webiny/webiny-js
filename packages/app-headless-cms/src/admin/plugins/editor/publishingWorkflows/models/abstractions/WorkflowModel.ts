import { IWorkflow, IWorkflowStep } from "~/types.js";
import { IWorkflowStepModel } from "./WorkflowStepModel.js";

export interface IWorkflowModel extends IWorkflow {
    addStep(step: IWorkflowStep): void;
    removeStep(stepId: string): void;
    findStep(stepId: string): IWorkflowStepModel | undefined;
}
