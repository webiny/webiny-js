import { PbEditorElement } from "@webiny/app-page-builder/types";
import { atomFamily } from "recoil";

export type ElementsAtomType = PbEditorElement;

export const elementsAtom = atomFamily<ElementsAtomType, string>({
    key: "elementsAtom",
    default: () => null
});
