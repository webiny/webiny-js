import { UpdateDocumentActionArgsType } from "~/editor/recoil/actions";
import { SaveBlockActionEvent } from "./saveBlock";
import { BlockAtomType } from "~/blockEditor/state";
import { BlockEventActionCallable } from "~/blockEditor/types";

export const updateBlockAction: BlockEventActionCallable<
    UpdateDocumentActionArgsType<BlockAtomType>
> = (state, _, args) => {
    console.log("updateBlockAction", state, args);
    return {
        state: {
            block: {
                ...state.block,
                ...(args?.document || {})
            }
        },
        actions: [
            new SaveBlockActionEvent({
                debounce: args?.debounce || false,
                onFinish: args?.onFinish
            })
        ]
    };
};
