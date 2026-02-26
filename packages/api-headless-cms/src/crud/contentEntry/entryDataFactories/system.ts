import type { CmsEntry, IEntrySystem } from "~/types/index.js";

interface IInputWithPossibleSystem {
    system: Partial<IEntrySystem>;
}
interface IParams {
    input: Partial<IInputWithPossibleSystem>;
    original?: CmsEntry | null;
}

export const getSystem = ({ input, original }: IParams): IEntrySystem | undefined => {
    if (!input.system) {
        return original?.system;
    }
    return {
        ...original?.system,
        ...input.system
    };
};
