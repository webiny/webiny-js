import { SaveRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/types";
import { flattenElements } from "@webiny/app-page-builder/editor/helpers";

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
