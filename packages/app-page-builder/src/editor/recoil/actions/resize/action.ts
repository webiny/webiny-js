import { ResizeStartActionEvent } from "./event";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";

export const resizeStartAction: EventActionCallableType<ResizeStartActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isResizing: true
            }
        }
    };
};

export const resizeEndAction: EventActionCallableType<ResizeStartActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isResizing: true
            }
        }
    };
};
