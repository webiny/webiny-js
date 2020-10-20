import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules/ui/uiAtom";

export const activateElementMutation: MutationActionCallable<UiAtomType, string> = (
    uiState,
    id
) => {
    return {
        ...uiState,
        activeElement: id
    };
};
