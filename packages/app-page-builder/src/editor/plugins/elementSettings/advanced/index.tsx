import { PbEditorEventActionPlugin } from "~/types";
import { CreateElementActionEvent } from "../../../recoil/actions";
import { advancedSettingsEditorAction } from "./advancedSettingsEditorAction";

export default [
    {
        name: "pb-editor-event-action-advanced-settings",
        type: "pb-editor-event-action-plugin",
        onEditorMount(handler) {
            return handler.on(CreateElementActionEvent, advancedSettingsEditorAction);
        }
    } as PbEditorEventActionPlugin
];
