import { elementWithChildrenByIdSelector } from "../../elements/selectors/elementWithChildrenByIdSelector";
import { activeElementIdSelector } from "./activeElementIdSelector";
import { selector } from "recoil";
import { PbElement } from "@webiny/app-page-builder/types";

export const activeElementWithChildrenSelector = selector<PbElement>({
    key: "activeElementWithChildrenSelector",
    get: ({ get }) => {
        const id = get(activeElementIdSelector);
        if (!id) {
            throw new Error("There is no active element.");
        }
        return get(elementWithChildrenByIdSelector(id));
    }
});
