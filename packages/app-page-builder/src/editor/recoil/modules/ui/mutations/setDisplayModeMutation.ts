import { MutationActionCallable } from "../../../eventActions";
import { UiAtomType } from "../uiAtom";

export const setDisplayModeMutation: MutationActionCallable<UiAtomType, string> = (
    state,
    displayMode
) => {
    return {
        ...state,
        displayMode
    };
};
