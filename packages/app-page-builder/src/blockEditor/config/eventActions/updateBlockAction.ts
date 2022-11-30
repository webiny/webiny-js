import { UpdateDocumentActionArgsType } from "~/editor/recoil/actions";
import { BlockAtomType } from "~/blockEditor/state";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { ToggleBlockDirtyStateActionEvent } from "~/blockEditor/config/eventActions/saveBlock";

export const updateBlockAction: BlockEventActionCallable<
    UpdateDocumentActionArgsType<BlockAtomType>
> = async (state, _, args) => {
    return {
        state: {
            block: {
                ...state.block,
                ...(args?.document || {})
            }
        },
        actions: [new ToggleBlockDirtyStateActionEvent({ dirty: true })]
    };
};
