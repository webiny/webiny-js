import { EventActionCallable, PbEditorEventActionPlugin } from "~/types";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { UpdateElementActionArgsType } from "~/editor/recoil/actions/updateElement";
import { UpdateDocumentActionEvent } from "./event";

const fireUpdateDocumentEvent: EventActionCallable<UpdateElementActionArgsType> = (
    _state,
    _meta,
    args
) => {
    // @ts-ignore
    const { debounce, onFinish, history } = args;

    return {
        actions: [new UpdateDocumentActionEvent({ debounce, onFinish, history })]
    };
};

export default (): PbEditorEventActionPlugin[] => {
    return [
        {
            type: "pb-editor-event-action-plugin",
            name: "pb-editor-event-action-update-element-document",
            onEditorMount: handler => {
                return handler.on(UpdateElementActionEvent, fireUpdateDocumentEvent);
            }
        }
    ];
};
