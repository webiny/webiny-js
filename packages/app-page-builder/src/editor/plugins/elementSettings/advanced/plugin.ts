import { PbEditorEventActionPlugin } from "~/types";
import { elementSettingsAction } from "./elementSettingsAction";
import { CreateElementActionEvent } from "~/editor/recoil/actions";

export default {
    name: "pb-editor-event-action-advanced-settings",
    type: "pb-editor-event-action-plugin",
    onEditorMount(handler) {
        return handler.on(CreateElementActionEvent, elementSettingsAction);
    }
} as PbEditorEventActionPlugin;
