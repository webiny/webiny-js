import { atom } from "recoil";

export type RootElementAtom = string;
export const rootElementAtom = atom<RootElementAtom>({
    key: "rootElementAtom",
    /**
     * There will never be an atom without the root element.
     * Initial state is null, but it is changed as soon as editor is loaded
     */
    default: null as unknown as RootElementAtom
});
