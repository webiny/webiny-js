import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UiAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export const updateSidebarActiveTabIndexMutation: MutationActionCallable<UiAtomType, number> = (
    state,
    index
) => {
    return {
        ...state,
        sidebarActiveTabIndex: index
    };
};
