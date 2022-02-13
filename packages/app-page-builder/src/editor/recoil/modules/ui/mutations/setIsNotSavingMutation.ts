import { UiAtomType } from "../..";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const setIsNotSavingMutation: EventActionHandlerMutationActionCallable<
    UiAtomType
> = state => {
    return {
        ...state,
        isSaving: false
    };
};
