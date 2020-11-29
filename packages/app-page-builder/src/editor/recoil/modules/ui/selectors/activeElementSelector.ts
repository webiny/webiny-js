import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { elementByIdSelector } from "../../elements/selectors/elementByIdSelector";
import { activeElementIdSelector } from "./activeElementIdSelector";
import { PbShallowElement } from "@webiny/app-page-builder/types";

export const activeElementSelector = connectedReadSelector<PbShallowElement | undefined>({
    key: "activeElementSelector",
    get: ({ get }) => {
        const id = get(activeElementIdSelector);
        if (!id) {
            return undefined;
        }
        return get(elementByIdSelector(id));
    }
});
