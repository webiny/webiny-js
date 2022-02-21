import { CloneElementActionEvent } from "./event";
import { cloneElementAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-clone-element",
        onEditorMount: handler => {
            return handler.on(CloneElementActionEvent, cloneElementAction);
        }
    };
};
