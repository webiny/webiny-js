import { PbEditorEventActionPlugin } from "~/types";
import { AfterDropElementActionEvent } from "./event";
import { afterDropElementAction } from "./action";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-drop-basic-element",
        onEditorMount: handler => {
            // @ts-ignore
            return handler.on(AfterDropElementActionEvent, afterDropElementAction);
        }
    };
};
