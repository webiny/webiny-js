import { DropElementActionEvent } from "./event";
import { dropElementAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-drop-element",
        onEditorMount: handler => {
            return handler.on(DropElementActionEvent, dropElementAction);
        }
    };
};
