import { UiAtomType } from "../..";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const disableDraggingMutation: EventActionHandlerMutationActionCallable<
    UiAtomType
> = state => {
    return {
        ...state,
        isDragging: false
    };
};
