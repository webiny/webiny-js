import { MutationActionCallable } from "../../../eventActions";
import { EditorMode, UiAtomType } from "../uiAtom";

export const setEditorModeMutation: MutationActionCallable<UiAtomType, EditorMode> = (
    state,
    editorMode
) => {
    return {
        ...state,
        editorMode
    };
};
