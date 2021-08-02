import { PbEditorEventActionPlugin } from "~/types";
import { UpdateElementTreeActionEvent } from "./event";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-update-element-tree",
        onEditorMount: handler => {
            // @ts-ignore
            return handler.on(UpdateElementTreeActionEvent, () => {
                return {};
            });
        }
    } as PbEditorEventActionPlugin;
};
