import type { IWorkflowStateStep, IWorkflowStep } from "~/types.js";

export interface IWorkflowStateStepModel extends IWorkflowStateStep, IWorkflowStep {
    toJS(): IWorkflowStateStep;
    updateStep(input: Partial<IWorkflowStateStep>): void;
}
