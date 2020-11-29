import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ResizeEndActionArgsType, ResizeStartActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";

export const resizeStartAction: EventActionCallableType<ResizeStartActionArgsType> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isResizing: true
            }
        }
    };
};

export const resizeEndAction: EventActionCallableType<ResizeEndActionArgsType> = (
    state,
    meta,
    { element }
) => {
    const actions = [];
    if (element) {
        actions.push(new UpdateElementActionEvent({ element }));
    }
    return {
        state: {
            ui: {
                ...state.ui,
                isResizing: false
            }
        },
        actions
    };
};
