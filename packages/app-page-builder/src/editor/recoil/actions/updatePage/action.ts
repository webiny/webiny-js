import { SaveRevisionActionEvent } from "..";
import { UpdatePageRevisionActionArgsType } from "./types";
import { EventActionCallable } from "~/types";

export const updatePageAction: EventActionCallable<UpdatePageRevisionActionArgsType> = (
    state,
    _,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const actions = [
        new SaveRevisionActionEvent({
            debounce: args.debounce,
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
