import { UpdateElementActionEvent } from "./event";
import { updateElementAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-element",
        onEditorMount: handler => {
            return handler.on(UpdateElementActionEvent, updateElementAction);
        }
    };
};
