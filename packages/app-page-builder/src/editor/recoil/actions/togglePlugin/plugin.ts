import { TogglePluginActionEvent } from "./event";
import { togglePluginAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-toggle-plugin",
        onEditorMount: handler => {
            return handler.on(TogglePluginActionEvent, togglePluginAction);
        }
    };
};
