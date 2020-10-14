import { elementByIdSelector } from "../../elements/selectors/elementByIdSelector";
import { activeElementIdSelector } from "./activeElementIdSelector";
import { selector } from "recoil";
import { PbShallowElement } from "@webiny/app-page-builder/types";

export const activeElementSelector = selector<PbShallowElement>({
    key: "activeElementSelector",
    get: ({ get }) => {
        const id = get(activeElementIdSelector);
        if (!id) {
            throw new Error("There is no active element.");
        }
        return get(elementByIdSelector(id));
    }
});
