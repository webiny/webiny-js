import { SaveRevisionActionEvent } from "..";
import { UpdateElementActionArgsType } from "./types";
import { EventActionCallable } from "../../../../types";
import { flattenElements } from "../../../helpers";

export const updateElementAction: EventActionCallable<UpdateElementActionArgsType> = (
    state,
    { client },
    { element, history }
) => {
    const actions = [];
    if (history === true) {
        if (!client) {
            throw new Error(
                "You cannot save revision while updating if you do not pass client arg."
            );
        }
        actions.push(new SaveRevisionActionEvent());
    }

    const flattenedContent = flattenElements(element);

    return {
        state: {
            elements: flattenedContent
        },
        actions
    };
};
