import { DeleteElementActionEvent } from "./event";
import { deleteElementAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-delete-element",
        onEditorMount: handler => {
            return handler.on(DeleteElementActionEvent, deleteElementAction);
        }
    } as PbEditorEventActionPlugin;
};
