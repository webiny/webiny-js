import { MutationActionCallable } from "../../../eventActions";
import { SidebarAtomType } from "../sidebarAtom";

export const highlightSidebarTabMutation: MutationActionCallable<SidebarAtomType, boolean> = (
    state,
    highlight
) => {
    return {
        ...state,
        highlightTab: highlight
    };
};
