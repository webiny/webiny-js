import { DisplayMode } from "../../../../types";
import { connectedAtom } from "../connected";

export type PagePreviewDimension = {
    width: number;
    height: number;
};

export type UiAtomType = {
    isDragging: boolean; // TODO: separate atom: InteractionAtom
    isResizing: boolean; // TODO: remove
    isSaving: boolean; // TODO: separate atom: NetworkAtom
    textEditorActive: boolean; // TODO: remove
    sidebarActiveTabIndex: number; // TODO: separate atom: SidebarAtom
    highlightElementTab: boolean; // TODO: separate atom: SidebarAtom
    displayMode: DisplayMode; // TODO: separate atom: DisplayAtom
    pagePreviewDimension: PagePreviewDimension; // TODO: separate atom: DisplayAtom
};
export const uiAtom = connectedAtom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
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
