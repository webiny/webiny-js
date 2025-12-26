import type { IEntryState } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

export const getStateValues = (state: WorkflowState): IEntryState => {
    const activeStep = state.currentStep;

    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
