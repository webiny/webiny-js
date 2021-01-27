import { CloneElementActionEvent } from "./event";
import { cloneElementAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-clone-element",
        onEditorMount: handler => {
            return handler.on(CloneElementActionEvent, cloneElementAction);
        }
    } as PbEditorEventActionPlugin;
};
