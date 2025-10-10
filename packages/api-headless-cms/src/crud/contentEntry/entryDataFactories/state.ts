import type { CmsEntry, ICmsEntryState } from "~/types/index.js";

interface IInputWithPossibleState {
    state: Partial<ICmsEntryState> | null;
}
interface IParams {
    input: Partial<IInputWithPossibleState>;
    original?: CmsEntry | null;
}

export const getState = ({ input, original }: IParams): ICmsEntryState | undefined => {
    if (input?.state?.id) {
        return {
            id: input.state.id,
            name: input.state?.name || original?.state?.name || "unknown"
        };
    }
    return original?.state;
};
