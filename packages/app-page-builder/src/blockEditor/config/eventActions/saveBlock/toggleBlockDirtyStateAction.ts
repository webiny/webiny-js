import { BlockEventActionCallable } from "~/blockEditor/types";
import { ToggleBlockDirtyStateActionArgsType } from "~/blockEditor/config/eventActions/saveBlock/types";

export const toggleBlockDirtyStateAction: BlockEventActionCallable<
    ToggleBlockDirtyStateActionArgsType
> = (state, _, args) => {
    if (!args) {
        return {
            actions: []
        };
    }
    return {
        state: {
            block: {
                ...state.block,
                isDirty: args.dirty
            }
        },
        actions: []
    };
};
