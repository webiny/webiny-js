import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateModel } from "@webiny/api-workflows/context/abstractions/WorkflowState.js";

export const getStateValues = (state: IWorkflowStateModel): ICmsEntryState | undefined => {
    const activeStep = state.getActiveStep();
    if (!activeStep) {
        return undefined;
    }

    return {
        workflowId: state.workflowId,
        stepId: activeStep.id,
        stepName: activeStep.title,
        state: activeStep.state
    };
};
