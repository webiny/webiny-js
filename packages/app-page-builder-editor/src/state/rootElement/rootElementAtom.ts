import { atom } from "recoil";

export type RootElementAtom = string | undefined;

export const rootElementAtom = atom<RootElementAtom>({
    key: "v2.rootElementAtom",
    default: undefined
});
