import { PbEditorElement } from "@webiny/app-page-builder/types";
import {atom, atomFamily} from "recoil";

export type ElementsAtomType = PbEditorElement;

export const elementsAtom = atomFamily<ElementsAtomType, string>({
    key: "elementsAtom",
    default: () => null
});


export const elementsIdListAtom = atom<string[]>({
    key: "elementsIdListAtom",
    default: [],
});