import type { IWorkflowState } from "@webiny/api-workflows";
import type { ICmsEntryState } from "@webiny/api-headless-cms/types/index.js";

export const getState = (state: IWorkflowState): ICmsEntryState | undefined => {
    if (!state.step) {
        return undefined;
    }
    return {
        stepId: state.step?.id,
        stepName: state.step?.name,
        state: state.step?.state
    };
};
