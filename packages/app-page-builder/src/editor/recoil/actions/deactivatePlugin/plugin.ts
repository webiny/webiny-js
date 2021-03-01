import { DeactivatePluginActionEvent } from "./event";
import { deactivatePluginAction } from "./action";
import { PbEditorEventActionPlugin } from "../../../../types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-deactivate-plugin",
        onEditorMount: handler => {
            return handler.on(DeactivatePluginActionEvent, deactivatePluginAction);
        }
    } as PbEditorEventActionPlugin;
};
