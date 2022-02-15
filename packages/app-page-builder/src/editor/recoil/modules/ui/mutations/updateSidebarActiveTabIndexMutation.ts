import { EventActionHandlerMutationActionCallable } from "~/types";
import { SidebarAtomType } from "../sidebarAtom";

export const updateSidebarActiveTabIndexMutation: EventActionHandlerMutationActionCallable<
    SidebarAtomType,
    number
> = (state, index) => {
    return {
        ...state,
        activeTabIndex: index
    };
};
