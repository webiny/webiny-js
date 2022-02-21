import { PbEditorElement } from "~/types";
import { atomFamily } from "recoil";

export type ElementsAtomType = PbEditorElement;

export const elementsAtom = atomFamily<ElementsAtomType, string>({
    key: "elementsAtom",
    default: () => null
});
