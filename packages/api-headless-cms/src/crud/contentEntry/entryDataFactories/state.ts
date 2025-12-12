import type { CmsEntry, IEntryState } from "~/types/index.js";

interface IInputWithPossibleState {
    state: Partial<IEntryState> | null;
}
interface IParams {
    input: Partial<IInputWithPossibleState>;
    original?: CmsEntry | null;
}

export const getState = ({ input, original }: IParams): IEntryState | undefined => {
    if (
        !input?.state?.stepId ||
        !input.state.state ||
        !input.state.stepName ||
        !input.state.workflowId
    ) {
        return original?.state;
    }
    return {
        workflowId: input.state.workflowId,
        stepId: input.state.stepId,
        stepName: input.state.stepName,
        state: input.state.state
    };
};
