import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export const highlightElementTabMutation: MutationActionCallable<UiAtomType, boolean> = (
    state,
    highlight
) => {
    return {
        ...state,
        highlightElementTab: highlight
    };
};
