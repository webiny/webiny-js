import { atom } from "recoil";

export type UiAtomType = {
    isDragging: boolean;
    isResizing: boolean;
    slateFocused: boolean;
    activeElement: string | null;
    highlightElement: string | null;
};
export const uiAtom = atom<UiAtomType>({
    key: "uiAtom",
    default: {
        isDragging: false,
        isResizing: false,
        slateFocused: false,
        activeElement: null,
        highlightElement: null
    }
});
