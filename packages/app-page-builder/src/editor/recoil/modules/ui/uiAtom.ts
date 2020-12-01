import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    activeElement: string | null;
    highlightElement: string | null;
    isSaving: boolean;
    textEditorActive: boolean;
};
export const uiAtom = connectedAtom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        activeElement: null,
        highlightElement: null,
        isSaving: false,
        textEditorActive: false
    }
});
