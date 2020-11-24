import { DropElementActionEvent } from "./event";
import { dropElementAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-drop-element",
        onEditorMount: handler => {
            return handler.on(DropElementActionEvent, dropElementAction);
        }
    } as PbEditorEventActionPlugin;
};
