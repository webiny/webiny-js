import { DisplayMode } from "../../../../types";
import { connectedAtom } from "../connected";

export type PagePreviewDimension = {
    width: number;
    height: number;
};

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    activeElement: string | null;
    highlightElement: string | null;
    isSaving: boolean;
    textEditorActive: boolean;
    sidebarActiveTabIndex: number;
    highlightElementTab: boolean;
    displayMode: DisplayMode;
    pagePreviewDimension: PagePreviewDimension;
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
        displayMode: DisplayMode.DESKTOP,
        pagePreviewDimension: {
            width: 100,
            height: 100
        }
    }
});
