import { DragStartActionEvent, DragEndActionEvent } from "./event";
import { dragStartAction, dragEndAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return [
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-drag-start",
            onEditorMount: handler => {
                return handler.on(DragStartActionEvent, dragStartAction);
            }
        } as PbEditorEventActionPlugin,
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-drag-end",
            onEditorMount: handler => {
                return handler.on(DragEndActionEvent, dragEndAction);
            }
        } as PbEditorEventActionPlugin
    ];
};
