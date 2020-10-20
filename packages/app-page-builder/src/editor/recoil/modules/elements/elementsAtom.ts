import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { PbShallowElement } from "@webiny/app-page-builder/types";

export type ElementsAtomType = {
    [id: string]: PbShallowElement;
};
export const elementsAtom = connectedAtom<ElementsAtomType>({
    key: "elementsAtom",
    default: {}
});
