import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { extrapolateContentElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { selectorFamily } from "recoil";
import { contentSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbElement } from "@webiny/app-page-builder/types";

export const elementWithChildrenByIdSelector = selectorFamily<PbElement | undefined, string>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            const content = get(contentSelector);
            if (!element || !content) {
                return undefined;
            }
            const { path } = element;
            return extrapolateContentElementHelper(content, path);
        };
    }
});
export const elementWithChildrenByPathSelector = selectorFamily<PbElement | undefined, string>({
    key: "elementWithChildrenByIdSelector",
    get: path => {
        return ({ get }) => {
            const content = get(contentSelector);
            if (!content) {
                return undefined;
            }
            return extrapolateContentElementHelper(content, path);
        };
    }
});

export const getElementWithChildrenByPath = (
    state: PbState,
    path: string
): PbElement | undefined => {
    const content = state.content;
    if (!content) {
        return undefined;
    }
    return extrapolateContentElementHelper(content, path);
};
export const getElementWithChildrenById = (state: PbState, id: string): PbElement | undefined => {
    const element = state.elements[id];
    const content = state.content;
    if (!element || !content) {
        return undefined;
    }
    return extrapolateContentElementHelper(content, element.path);
};
