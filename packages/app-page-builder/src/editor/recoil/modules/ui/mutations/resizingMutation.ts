import { UiAtomType } from "../..";
import { EventActionHandlerMutationActionCallable } from "~/types";

const updateResizeValue: EventActionHandlerMutationActionCallable<UiAtomType, boolean> = (
    state,
    value
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
