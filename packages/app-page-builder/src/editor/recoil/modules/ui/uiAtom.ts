import { DisplayMode } from "../../../../types";
import { connectedAtom } from "../connected";

export type PagePreviewDimension = {
    width: number;
    height: number;
};

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    isSaving: boolean;
    textEditorActive: boolean;
    displayMode: DisplayMode;
    pagePreviewDimension: PagePreviewDimension;
};
export const uiAtom = connectedAtom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        isSaving: false,
        textEditorActive: false,
        displayMode: DisplayMode.DESKTOP,
        pagePreviewDimension: {
            width: 100,
            height: 100
        }
    }
});
