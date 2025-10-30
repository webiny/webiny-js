import type { IWorkflowState, IWorkflowStateStep } from "~/types.js";

export interface IWorkflowStatesWidgetItem extends IWorkflowState {
    currentStep: IWorkflowStateStep;
}
