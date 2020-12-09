import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { uiAtom } from "../uiAtom";

export const sidebarActiveTabIndexSelector = connectedReadSelector<number>({
    key: "sidebarActiveTabIndexSelector",
    get: ({ get }) => {
        const { sidebarActiveTabIndex } = get(uiAtom);
        return sidebarActiveTabIndex;
    }
});
