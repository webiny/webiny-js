import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { EventActionHandlerMutationActionCallable } from "@webiny/app-page-builder/types";

export const setIsSavingMutation: EventActionHandlerMutationActionCallable<UiAtomType> = state => {
    return {
        ...state,
        isSaving: true
    };
};
