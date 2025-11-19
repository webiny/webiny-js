import type { IWorkflowStateModel } from "@webiny/api-workflows";
import type { IWbPageState } from "~/types.js";

export const getStateValues = (state: IWorkflowStateModel): IWbPageState | undefined => {
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
