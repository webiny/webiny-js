import { SaveRevisionActionEvent } from "..";
import { UpdatePageRevisionActionArgsType } from "./types";
import { EventActionCallable } from "../../../../types";

export const updatePageAction: EventActionCallable<UpdatePageRevisionActionArgsType> = (
    state,
    meta,
    args
) => {
    const actions = [
        new SaveRevisionActionEvent({
            onFinish: args.onFinish
        })
    ];
    return {
        state: {
            page: {
                ...state.page,
                ...args.page
            }
        },
        actions
    };
};
