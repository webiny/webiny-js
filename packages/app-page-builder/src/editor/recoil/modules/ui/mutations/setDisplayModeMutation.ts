import { DisplayMode } from "../../../../../types";
import { MutationActionCallable } from "../../../eventActions";
import { UiAtomType } from "../uiAtom";

export const setDisplayModeMutation: MutationActionCallable<UiAtomType, DisplayMode> = (
    state,
    displayMode
) => {
    return {
        ...state,
        displayMode
    };
};
