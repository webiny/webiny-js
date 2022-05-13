import { atom } from "recoil";

export type ActiveElementAtomType = string | undefined;
export const activeElementAtom = atom<ActiveElementAtomType>({
    key: "v2.activeElementAtom",
    default: undefined
});
