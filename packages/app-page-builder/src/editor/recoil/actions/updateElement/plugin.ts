import { UpdateElementActionEvent } from "./event";
import { updateElementAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-element",
        onEditorMount: (handler) => {
            return handler.on(UpdateElementActionEvent, updateElementAction);
        },
    } as PbEditorEventActionPlugin;
};