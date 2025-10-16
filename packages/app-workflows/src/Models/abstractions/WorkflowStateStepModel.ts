import type { IWorkflowStateStep } from "~/types.js";

export interface IWorkflowStateStepModel extends IWorkflowStateStep {
    toJS(): IWorkflowStateStep;
    updateStep(input: Partial<IWorkflowStateStep>): void;
}
