import { SaveRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdatePageRevisionActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";

export const updateRevisionAction: EventActionCallableType<UpdatePageRevisionActionArgsType> = (
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
