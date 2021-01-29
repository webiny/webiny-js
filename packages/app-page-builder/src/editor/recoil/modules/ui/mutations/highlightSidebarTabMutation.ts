import { SidebarAtomType } from "../sidebarAtom";
import { EventActionHandlerMutationActionCallable } from "@webiny/app-page-builder/types";

export const highlightSidebarTabMutation: EventActionHandlerMutationActionCallable<
    SidebarAtomType,
    boolean
> = (state, highlight) => {
    return {
        ...state,
        highlightTab: highlight
    };
};
