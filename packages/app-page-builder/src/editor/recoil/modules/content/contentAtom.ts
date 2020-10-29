import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { PbElement } from "@webiny/app-page-builder/types";

export type ContentAtomType = PbElement;
export const contentAtom = connectedAtom<ContentAtomType>({
    key: "contentAtom",
    default: null
});
