import { UiAtomType } from "../..";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const enableDraggingMutation: EventActionHandlerMutationActionCallable<
    UiAtomType
> = state => {
    return {
        ...state,
        isDragging: true
    };
};
