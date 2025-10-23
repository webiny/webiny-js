import type { IWorkflowState } from "@webiny/api-workflows";
import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";

export const getStateValues = (state: IWorkflowState): ICmsEntryState | undefined => {
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
