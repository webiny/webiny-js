import { DragStartActionEvent } from "./event";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";

export const dragStartAction: EventActionCallableType<DragStartActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isDragging: true
            }
        }
    };
};

export const dragEndAction: EventActionCallableType<DragStartActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isDragging: true
            }
        }
    };
};
