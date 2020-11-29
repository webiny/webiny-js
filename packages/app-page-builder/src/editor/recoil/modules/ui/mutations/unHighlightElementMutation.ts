import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export const unHighlightElementMutation: MutationActionCallable<UiAtomType> = state => {
    return {
        ...state,
        highlightElement: null
    };
};
