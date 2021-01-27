import { atom } from "recoil";

export type HighlightElementAtomType = string | null;
export const highlightElementAtom = atom<HighlightElementAtomType>({
    key: "highlightElementAtom",
    default: null
});
