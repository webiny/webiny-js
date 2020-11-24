import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

const updateResizeValue: MutationActionCallable<UiAtomType, boolean> = (state, value: boolean) => {
    return {
        ...state,
        isResizing: value
    };
};

export const startResizeMutation: MutationActionCallable<UiAtomType> = state => {
    return updateResizeValue(state, true);
};

export const endResizeMutation: MutationActionCallable<UiAtomType> = state => {
    return updateResizeValue(state, false);
};
