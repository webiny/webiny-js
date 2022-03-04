import { PbEditorEventActionPlugin } from "~/types";
import { UpdateElementTreeActionEvent } from "./event";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-element-tree",
        onEditorMount: handler => {
            return handler.on(UpdateElementTreeActionEvent, () => {
                return {
                    actions: []
                };
            });
        }
    };
};
