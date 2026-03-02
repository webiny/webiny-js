import type { CmsEntry, ICmsEntrySystem } from "~/types/index.js";

interface IInputWithPossibleSystem {
    system: Partial<ICmsEntrySystem>;
}
interface IParams {
    input: Partial<IInputWithPossibleSystem>;
    original?: CmsEntry | null;
}

export const getSystem = ({ input, original }: IParams): ICmsEntrySystem | undefined => {
    if (!input.system) {
        return original?.system;
    }
    return {
        ...original?.system,
        ...input.system
    };
};
