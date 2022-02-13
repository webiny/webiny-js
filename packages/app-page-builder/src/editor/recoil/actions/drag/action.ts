import { DragEndActionEvent, DragStartActionEvent } from "./event";
import { EventActionCallable } from "~/types";

export const dragStartAction: EventActionCallable<DragStartActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isDragging: true
            }
        }
    };
};

export const dragEndAction: EventActionCallable<DragEndActionEvent> = state => {
    return {
        state: {
            ui: {
                ...state.ui,
                isDragging: false
            }
        }
    };
};
