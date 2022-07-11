import { UpdateElementTreeActionEvent } from "..";
import { EventActionCallable } from "~/types";
import { flattenElements } from "~/editor/helpers";
import { UpdateElementActionArgsType } from "./types";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions/updateDocument";

export const updateElementAction: EventActionCallable<UpdateElementActionArgsType> = (
    _state,
    _meta,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }

    const { element, triggerUpdateElementTree, onFinish, debounce, history } = args;
    const actions = [];

    if (history) {
        actions.push(new UpdateDocumentActionEvent({ onFinish, debounce, history }));
    }

    // Add "UpdateElementTreeActionEvent" to actions.
    if (triggerUpdateElementTree) {
        actions.push(new UpdateElementTreeActionEvent());
    }

    const flattenedContent = flattenElements(element);

    return {
        state: {
            elements: flattenedContent
        },
        actions
    };
};
