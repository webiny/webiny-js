import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { EventActionHandlerMutationActionCallable } from "@webiny/app-page-builder/types";

export const disableDraggingMutation: EventActionHandlerMutationActionCallable<UiAtomType> = state => {
    return {
        ...state,
        isDragging: false
    };
};
