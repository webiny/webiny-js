import { SaveRevisionActionEvent } from "./event";
import { saveRevisionAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-save-revision",
        onEditorMount: (handler) => {
            return handler.on(SaveRevisionActionEvent, saveRevisionAction);
        },
    } as PbEditorEventActionPlugin;
};