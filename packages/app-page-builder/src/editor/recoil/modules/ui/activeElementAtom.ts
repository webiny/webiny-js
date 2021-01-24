import { connectedAtom } from "../connected";

export type ActiveElementAtomType = string | null;
export const activeElementAtom = connectedAtom<ActiveElementAtomType>({
    key: "activeElementAtom",
    default: null
});
