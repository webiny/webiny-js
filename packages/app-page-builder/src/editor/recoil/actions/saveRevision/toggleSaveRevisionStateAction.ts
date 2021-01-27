import { ToggleSaveRevisionStateActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/types";

export const toggleSaveRevisionStateAction: EventActionCallable<ToggleSaveRevisionStateActionArgsType> = (
    state,
    meta,
    args
) => {
    return {
        state: {
            ui: {
                ...state.ui,
                isSaving: args.saving
            }
        }
    };
};
