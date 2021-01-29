import { atom } from "recoil";

export type ActiveElementAtomType = string | null;
export const activeElementAtom = atom<ActiveElementAtomType>({
    key: "activeElementAtom",
    default: null
});
