import { MoveBlockActionEvent } from "./event";
import { moveBlockAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-move-block",
        onEditorMount: handler => {
            return handler.on(MoveBlockActionEvent, moveBlockAction);
        }
    } as PbEditorEventActionPlugin;
};
