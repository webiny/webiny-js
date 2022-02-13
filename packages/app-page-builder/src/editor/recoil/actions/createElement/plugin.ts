import { CreateElementActionEvent } from "./event";
import { createElementAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-create-element",
        onEditorMount: handler => {
            return handler.on(CreateElementActionEvent, createElementAction);
        }
    };
};
