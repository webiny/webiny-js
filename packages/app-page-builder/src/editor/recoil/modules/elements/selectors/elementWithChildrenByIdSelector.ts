import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { extrapolateContentElementHelper } from "@webiny/app-page-builder/editor/recoil/helpers";
import { selectorFamily } from "recoil";
import { contentSelector } from "../../page/selectors/contentSelector";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbElement } from "@webiny/app-page-builder/types";

export const elementWithChildrenByIdSelector = selectorFamily<PbElement | undefined, string>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            if (!element) {
                return undefined;
            }
            const { path } = element;
            const content = get(contentSelector);
            return extrapolateContentElementHelper(content, path);
        };
    }
});
export const getElementWithChildrenById = (state: PbState, id: string): PbElement | undefined => {
    const element = state.elements[id];
    const content = state.page.content;
    if (!element || !content) {
        return undefined;
    }
    return extrapolateContentElementHelper(content, element.path);
};
