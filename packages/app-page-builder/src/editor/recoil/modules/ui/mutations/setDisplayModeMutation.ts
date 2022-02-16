import { DisplayMode, EventActionHandlerMutationActionCallable } from "~/types";
import { UiAtomType } from "../uiAtom";

export const setDisplayModeMutation: EventActionHandlerMutationActionCallable<
    UiAtomType,
    DisplayMode
> = (state, displayMode: DisplayMode) => {
    return {
        ...state,
        displayMode
    };
};
