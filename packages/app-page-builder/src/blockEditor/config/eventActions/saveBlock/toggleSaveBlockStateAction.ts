import { BlockEventActionCallable } from "~/blockEditor/types";
import { ToggleSaveBlockStateActionArgsType } from "~/blockEditor/config/eventActions/saveBlock/types";

export const toggleSaveBlockStateAction: BlockEventActionCallable<
    ToggleSaveBlockStateActionArgsType
> = (state, _, args) => {
    if (!args) {
        return {
            actions: []
        };
    }
    return {
        state: {
            ui: {
                ...state.ui,
                isSaving: args.saving
            }
        },
        actions: []
    };
};
