import { SaveRevisionActionEvent } from "./saveRevision";
import { UpdateDocumentActionArgsType } from "~/editor/recoil/actions/updateDocument/types";
import { PageAtomType } from "~/pageEditor/state";
import { PageEventActionCallable } from "~/pageEditor/types";

export const updatePageAction: PageEventActionCallable<
    UpdateDocumentActionArgsType<PageAtomType>
> = (state, _, args) => {
    return {
        state: {
            page: {
                ...state.page,
                ...(args?.document || {})
            }
        },
        actions: [
            new SaveRevisionActionEvent({
                debounce: args?.debounce ?? true,
                onFinish: args?.onFinish
            })
        ]
    };
};
