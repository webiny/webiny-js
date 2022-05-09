import { atomFamily } from "recoil";
import { PbEditorElement } from "~/types";

export type ElementsAtomType = PbEditorElement;

export const elementsAtom = atomFamily<ElementsAtomType | undefined, string>({
    key: "v2.elementsAtom",
    default: () => undefined
});
