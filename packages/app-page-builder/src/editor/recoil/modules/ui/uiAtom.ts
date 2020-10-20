import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    slateFocused: boolean;
    activeElement: string | null;
    highlightElement: string | null;
};
export const uiAtom = connectedAtom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        slateFocused: false,
        activeElement: null,
        highlightElement: null
    }
});
