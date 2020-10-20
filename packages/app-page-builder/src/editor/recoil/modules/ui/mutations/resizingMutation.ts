import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

const updateResizeValue: MutationActionCallable<UiAtomType, boolean> = (
    uiState,
    value: boolean
) => {
    return {
        ...uiState,
        isResizing: value
    };
};

export const startResizeMutation: MutationActionCallable<UiAtomType> = uiState => {
    return updateResizeValue(uiState, true);
};

export const endResizeMutation: MutationActionCallable<UiAtomType> = uiState => {
    return updateResizeValue(uiState, false);
};
