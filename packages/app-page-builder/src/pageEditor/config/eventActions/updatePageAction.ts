import { SaveRevisionActionEvent } from "./saveRevision";
import { EventActionCallable } from "~/types";
import { UpdateDocumentActionArgsType } from "~/editor/recoil/actions/updateDocument/types";
import { PageAtomType } from "~/editor/recoil/modules";

export const updatePageAction: EventActionCallable<UpdateDocumentActionArgsType<PageAtomType>> = (
    state,
    _,
    args
) => {
    return {
        state: {
            page: {
                ...state.page,
                ...(args?.document || {})
            }
        },
        actions: [
            new SaveRevisionActionEvent({
                debounce: args?.debounce || false,
                onFinish: args?.onFinish
            })
        ]
    };
};
