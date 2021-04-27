import { PbEditorEventActionPlugin } from "~/types";
import { AfterUpdateElementsActionEvent } from "./event";

export default () => {
    return {
        type: "pb-editor-event-action-plugin",
        name: "pb-editor-event-action-drop-basic-element",
        onEditorMount: handler => {
            // @ts-ignore
            return handler.on(AfterUpdateElementsActionEvent, () => {
                console.log("Running [AfterUpdateElementsActionEvent] action.");
                return {};
            });
        }
    } as PbEditorEventActionPlugin;
};
