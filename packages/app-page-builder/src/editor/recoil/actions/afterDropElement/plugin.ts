import { PbEditorEventActionPlugin } from "../../../../types";
import { AfterDropElementActionEvent } from "./event";
import { afterDropElementAction } from "./action";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-drop-basic-element",
        onEditorMount: handler => {
            return handler.on(AfterDropElementActionEvent, afterDropElementAction);
        }
    } as PbEditorEventActionPlugin;
};
