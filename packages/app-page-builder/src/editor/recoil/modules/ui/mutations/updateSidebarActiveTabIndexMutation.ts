import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { SidebarAtomType } from "../sidebarAtom";

export const updateSidebarActiveTabIndexMutation: MutationActionCallable<
    SidebarAtomType,
    number
> = (state, index) => {
    return {
        ...state,
        activeTabIndex: index
    };
};
