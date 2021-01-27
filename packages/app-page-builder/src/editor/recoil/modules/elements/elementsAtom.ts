import { PbElement } from "@webiny/app-page-builder/types";
import { atomFamily } from "recoil";

export type ElementsAtomType = PbElement;

export const elementsAtom = atomFamily<ElementsAtomType, string>({
    key: "elementsAtom",
    default: () => null
});
