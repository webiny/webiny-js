import type { IEntryState } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateModel } from "@webiny/api-workflows/context/abstractions/WorkflowState.js";

export const getStateValues = (state: IWorkflowStateModel): IEntryState => {
    const activeStep = state.currentStep;

    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
