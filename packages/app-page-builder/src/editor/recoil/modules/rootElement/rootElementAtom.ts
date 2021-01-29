import { atom } from "recoil";

export type RootElementAtom = string;
export const rootElementAtom = atom<RootElementAtom>({
    key: "rootElementAtom",
    default: null
});
