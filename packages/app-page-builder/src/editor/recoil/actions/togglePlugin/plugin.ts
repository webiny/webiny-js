import { TogglePluginActionEvent } from "./event";
import { togglePluginAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-toggle-plugin",
        onEditorMount: (handler) => {
            return handler.on(TogglePluginActionEvent, togglePluginAction);
        },
    } as PbEditorEventActionPlugin;
};