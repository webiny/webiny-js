import { UiAtomType } from "../..";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const setIsSavingMutation: EventActionHandlerMutationActionCallable<UiAtomType> = state => {
    return {
        ...state,
        isSaving: true
    };
};
