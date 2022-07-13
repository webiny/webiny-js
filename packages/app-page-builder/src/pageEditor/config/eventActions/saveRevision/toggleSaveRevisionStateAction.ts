import { ToggleSaveRevisionStateActionArgsType } from "./types";
import { PageEventActionCallable } from "~/pageEditor/types";

export const toggleSaveRevisionStateAction: PageEventActionCallable<
    ToggleSaveRevisionStateActionArgsType
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
