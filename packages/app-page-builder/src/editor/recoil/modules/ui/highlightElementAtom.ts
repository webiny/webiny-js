import { connectedAtom } from "../connected";

export type HighlightElementAtomType = string | null;
export const highlightElementAtom = connectedAtom<HighlightElementAtomType>({
    key: "highlightElementAtom",
    default: null
});
