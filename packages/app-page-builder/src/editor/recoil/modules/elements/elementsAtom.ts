import { atom } from "recoil";
import { PbShallowElement } from "@webiny/app-page-builder/types";

export type ElementsAtomType = {
    [id: string]: PbShallowElement;
};
export const elementsAtom = atom<ElementsAtomType>({
    key: "elementsAtom",
    default: {}
});
