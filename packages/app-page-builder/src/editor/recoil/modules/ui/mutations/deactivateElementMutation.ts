import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules/ui/uiAtom";

export const deactivateElementMutation: MutationActionCallable<UiAtomType> = uiState => {
    return {
        ...uiState,
        activeElement: null
    };
};
