import { SaveRevisionActionEvent, ToggleSaveRevisionStateActionEvent } from "./event";
import { saveRevisionAction } from "./saveRevisionAction";
import { toggleSaveRevisionStateAction } from "./toggleSaveRevisionStateAction";
import { PbEditorEventActionPlugin } from "~/types";

export default (): PbEditorEventActionPlugin[] => [
    {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-save-revision",
        onEditorMount: handler => {
            return handler.on(SaveRevisionActionEvent, saveRevisionAction);
        }
    },
    {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-toggle-save-revision-state",
        onEditorMount: handler => {
            return handler.on(ToggleSaveRevisionStateActionEvent, toggleSaveRevisionStateAction);
        }
    }
];
