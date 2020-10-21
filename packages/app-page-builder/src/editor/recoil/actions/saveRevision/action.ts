import { SaveRevisionActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/saveRevision/types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";

export const saveRevisionAction: EventActionCallableType<SaveRevisionActionArgsType> = () => {
    const actions = [];

    return {
        state: {},
        actions
    };
};
