import { CreateElementActionEvent } from "./event";
import { createElementAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-create-element",
        onEditorMount: handler => {
            return handler.on(CreateElementActionEvent, createElementAction);
        }
    } as PbEditorEventActionPlugin;
};
