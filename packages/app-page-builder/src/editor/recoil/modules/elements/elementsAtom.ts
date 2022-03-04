import { PbEditorElement } from "~/types";
import { atomFamily } from "recoil";

export interface ElementsAtomType extends PbEditorElement {
    isHighlighted?: boolean;
}

export const elementsAtom = atomFamily<ElementsAtomType | null, string>({
    key: "elementsAtom",
    default: () => null
});
