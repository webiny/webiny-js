import { ToggleSaveRevisionStateActionArgsType } from "./types";
import { EventActionCallable } from "../../../../types";

export const toggleSaveRevisionStateAction: EventActionCallable<ToggleSaveRevisionStateActionArgsType> =
    (state, _, args) => {
        return {
            state: {
                ui: {
                    ...state.ui,
                    isSaving: args.saving
                }
            }
        };
    };
