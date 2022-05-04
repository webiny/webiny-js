import { atom } from "recoil";
import { DisplayMode } from "~/types";

export type PagePreviewDimension = {
    width: number;
    height: number;
};

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    isSaving: boolean;
    displayMode: DisplayMode;
    pagePreviewDimension: PagePreviewDimension;
};
export const uiAtom = atom<UiAtomType>({
    key: "v2.uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        isSaving: false,
        displayMode: DisplayMode.DESKTOP,
        pagePreviewDimension: {
            width: 100,
            height: 100
        }
    }
});
