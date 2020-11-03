import { ResizeStartActionEvent, ResizeEndActionEvent } from "./event";
import { resizeStartAction, resizeEndAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return [
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-resize-start",
            onEditorMount: handler => {
                return handler.on(ResizeStartActionEvent, resizeStartAction);
            }
        } as PbEditorEventActionPlugin,
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-resize-end",
            onEditorMount: handler => {
                return handler.on(ResizeEndActionEvent, resizeEndAction);
            }
        } as PbEditorEventActionPlugin
    ];
};
