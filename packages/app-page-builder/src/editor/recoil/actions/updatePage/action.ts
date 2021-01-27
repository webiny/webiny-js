import { SaveRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdatePageRevisionActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/types";

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
