import { UpdatePageRevisionActionEvent } from "./event";
import { updateRevisionAction } from "./action";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-revision",
        onEditorMount: handler => {
            return handler.on(UpdatePageRevisionActionEvent, updateRevisionAction);
        }
    } as PbEditorEventActionPlugin;
};
