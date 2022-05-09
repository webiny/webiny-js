import { atom } from "recoil";

export type HighlightElementAtomType = string | undefined;

export const highlightElementAtom = atom<HighlightElementAtomType>({
    key: "v2.highlightElementAtom",
    default: undefined
});
