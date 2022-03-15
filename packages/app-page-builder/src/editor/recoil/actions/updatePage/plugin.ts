import { UpdatePageRevisionActionEvent } from "./event";
import { updatePageAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-revision",
        onEditorMount: handler => {
            return handler.on(UpdatePageRevisionActionEvent, updatePageAction);
        }
    };
};
