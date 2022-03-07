import { UpdateElementTreeActionEvent, SaveRevisionActionEvent } from "..";
import { EventActionCallable } from "~/types";
import { flattenElements } from "~/editor/helpers";
import { UpdateElementActionArgsType } from "./types";

export const updateElementAction: EventActionCallable<UpdateElementActionArgsType> = (
    _,
    { client },
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { element, history, triggerUpdateElementTree, debounce, onFinish } = args;
    const actions = [];
    if (history === true) {
        if (!client) {
            throw new Error(
                "You cannot save revision while updating if you do not pass client arg."
            );
        }
        actions.push(new SaveRevisionActionEvent({ debounce, onFinish }));
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
