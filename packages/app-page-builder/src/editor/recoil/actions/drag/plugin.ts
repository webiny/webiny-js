import { DragStartActionEvent, DragEndActionEvent } from "./event";
import { dragStartAction, dragEndAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin[] => {
    return [
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-drag-start",
            onEditorMount: handler => {
                return handler.on(DragStartActionEvent, dragStartAction);
            }
        },
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-drag-end",
            onEditorMount: handler => {
                return handler.on(DragEndActionEvent, dragEndAction);
            }
        }
    ];
};
