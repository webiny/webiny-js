import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { EventActionHandlerMutationActionCallable } from "@webiny/app-page-builder/types";

const updateResizeValue: EventActionHandlerMutationActionCallable<UiAtomType, boolean> = (
    state,
    value: boolean
) => {
    return {
        ...state,
        isResizing: value
    };
};

export const startResizeMutation: EventActionHandlerMutationActionCallable<UiAtomType> = state => {
    return updateResizeValue(state, true);
};

export const endResizeMutation: EventActionHandlerMutationActionCallable<UiAtomType> = state => {
    return updateResizeValue(state, false);
};
