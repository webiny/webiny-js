import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export const highlightElementMutation: MutationActionCallable<UiAtomType, string> = (state, id) => {
    return {
        ...state,
        highlightElement: id
    };
};
