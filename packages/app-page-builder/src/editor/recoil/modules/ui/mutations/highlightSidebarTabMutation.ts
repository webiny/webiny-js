import { SidebarAtomType } from "../sidebarAtom";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const highlightSidebarTabMutation: EventActionHandlerMutationActionCallable<
    SidebarAtomType,
    boolean
> = (state, highlight) => {
    return {
        ...state,
        highlightTab: highlight
    };
};
