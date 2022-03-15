import { DeleteElementActionEvent } from "./event";
import { deleteElementAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => ({
    type: "pb-editor-event-action-plugin",
    name: "pb-editor-event-action-delete-element",
    onEditorMount: handler => {
        return handler.on(DeleteElementActionEvent, deleteElementAction);
    }
});
