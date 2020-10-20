import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { activeElementIdSelector } from "./activeElementIdSelector";
import { PbElement } from "@webiny/app-page-builder/types";

export const activeElementWithChildrenSelector = connectedReadSelector<PbElement>({
    key: "activeElementWithChildrenSelector",
    get: ({ get }) => {
        const id = get(activeElementIdSelector);
        if (!id) {
            return;
        }
        return get(elementWithChildrenByIdSelector(id));
    }
});
