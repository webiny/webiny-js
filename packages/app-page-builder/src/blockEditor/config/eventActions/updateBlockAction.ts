import { UpdateDocumentActionArgsType } from "~/editor/recoil/actions";
import { BlockAtomType } from "~/blockEditor/state";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { ToggleSaveBlockStateActionEvent } from "./saveBlock/event";

export const updateBlockAction: BlockEventActionCallable<
    UpdateDocumentActionArgsType<BlockAtomType>
> = async (state, meta, args) => {
    console.log("updateBlockAction", state, args);

    meta.eventActionHandler.trigger(new ToggleSaveBlockStateActionEvent({ saving: true }));

    return {
        state: {
            block: {
                ...state.block,
                ...(args?.document || {})
            }
        },
        actions: []
    };
};
