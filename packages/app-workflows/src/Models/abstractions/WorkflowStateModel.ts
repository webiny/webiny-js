import type { IWorkflowState, IWorkflowStateStep } from "~/types.js";
import type { IWorkflowStateStepModel } from "./WorkflowStateStepModel.js";
import type { IObservableArray } from "mobx";

export interface IWorkflowStateModel extends Omit<IWorkflowState, "steps"> {
    readonly dirty: boolean;
    steps: IObservableArray<IWorkflowStateStepModel>;
    currentStep: IWorkflowStateStepModel | null;
    nextStep: IWorkflowStateStepModel | null;
    setSteps(steps: IWorkflowStateStep[]): void;
    addStep(step: IWorkflowStateStep): void;
    updateStep(step: IWorkflowStateStep): void;
    removeStep(id: string): void;
    findStep(id: string): IWorkflowStateStepModel | undefined;
    toJS(): IWorkflowState;
}
