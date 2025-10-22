import type { IWorkflowState } from "@webiny/api-workflows";
import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";

export const getStateValues = (state: IWorkflowState): ICmsEntryState | undefined => {
    if (!state.activeStep) {
        return undefined;
    }

    return {
        workflowId: state.workflow?.id || "unknown",
        stepId: state.activeStep.id,
        stepName: state.activeStep.name,
        state: state.activeStep.state
    };
};
