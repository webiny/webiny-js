import { atom } from "recoil";
import { PbShallowElement } from "@webiny/app-page-builder/types";

type ElementsAtom = {
    [id: string]: PbShallowElement;
};
export const elementsAtom = atom<ElementsAtom>({
    key: "elementsAtom",
    default: {}
});
