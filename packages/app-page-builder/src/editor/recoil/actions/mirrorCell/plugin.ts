import { MirrorCellActionEvent } from "./event";
import { mirrorCellAction } from "./action";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-mirror-cell",
        onEditorMount: handler => {
            return handler.on(MirrorCellActionEvent, mirrorCellAction);
        }
    };
};
