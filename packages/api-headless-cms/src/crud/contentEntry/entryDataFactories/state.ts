import type { CmsEntry, ICmsEntryState } from "~/types/index.js";

interface IInputWithPossibleState {
    state: Partial<ICmsEntryState> | null;
}
interface IParams {
    input: Partial<IInputWithPossibleState>;
    original?: CmsEntry | null;
}

export const getState = ({ input, original }: IParams): ICmsEntryState | undefined => {
    if (!input?.state?.stepId || !input.state.state || !input.state.stepName) {
        return original?.state;
    }
    return {
        stepId: input.state.stepId,
        stepName: input.state.stepName,
        state: input.state.state
    };
};
