import type { IWorkflowStep } from "~/types.js";

export interface IWorkflowStepModel extends IWorkflowStep {
    updateStep(input: Partial<IWorkflowStep>): void;
}
