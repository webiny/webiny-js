import type { ICmsEntryWorkflowState } from "@webiny/api-workflows/types.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

export const getStateValues = (state: WorkflowState): ICmsEntryWorkflowState => {
    const activeStep = state.currentStep;

    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
