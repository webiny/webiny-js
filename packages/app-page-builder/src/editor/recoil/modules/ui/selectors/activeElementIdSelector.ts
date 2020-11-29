import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { uiAtom } from "../uiAtom";

export const activeElementIdSelector = connectedReadSelector<string | undefined>({
    key: "activeElementIdSelector",
    get: ({ get }) => {
        const { activeElement } = get(uiAtom);
        return activeElement;
    }
});
