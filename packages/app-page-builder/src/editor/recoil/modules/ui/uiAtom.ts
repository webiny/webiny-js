import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export enum EditorMode {
    desktop = "desktop",
    tablet = "tablet",
    mobileLandscape = "mobileLandscape",
    mobilePortrait = "mobilePortrait"
}

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    activeElement: string | null;
    highlightElement: string | null;
    isSaving: boolean;
    textEditorActive: boolean;
    sidebarActiveTabIndex: number;
    highlightElementTab: boolean;
    editorMode: EditorMode;
};
export const uiAtom = connectedAtom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        activeElement: null,
        highlightElement: null,
        isSaving: false,
        textEditorActive: false,
        sidebarActiveTabIndex: 0,
        highlightElementTab: false,
        editorMode: EditorMode.desktop
    }
});
