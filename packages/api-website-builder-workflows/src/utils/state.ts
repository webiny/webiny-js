import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

export interface IWbPageState {
    workflowId: string;
    stepId: string;
    stepName: string;
    state: string;
}

export const getStateValues = (state: WorkflowState): IWbPageState => {
    const activeStep = state.currentStep;
    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
