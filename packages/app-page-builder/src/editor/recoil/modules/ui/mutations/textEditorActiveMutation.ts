import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export const textEditorIsActiveMutation: MutationActionCallable<UiAtomType> = (
    state: UiAtomType
) => {
    return {
        ...state,
        textEditorActive: true
    };
};

export const textEditorIsNotActiveMutation: MutationActionCallable<UiAtomType> = (
    state: UiAtomType
) => {
    return {
        ...state,
        textEditorActive: false
    };
};
