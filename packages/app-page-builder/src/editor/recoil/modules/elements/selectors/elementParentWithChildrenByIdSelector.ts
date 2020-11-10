import { contentSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { extrapolateContentElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementByIdSelector, getElementById } from "./elementByIdSelector";

const findElementParentWithChildrenById = (content: PbElement, element?: PbShallowElement) => {
    if (!element) {
        return undefined;
    }
    const paths = element.path.split(".").map(Number);
    paths.pop();
    if (paths.length === 1) {
        return content;
    }
    return extrapolateContentElementHelper(content, paths.join("."));
};

export const elementParentWithChildrenByIdSelector = selectorFamily<PbElement | undefined, string>({
    key: "elementParentWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            if (!id) {
                return undefined;
            }
            const element = get(elementByIdSelector(id));
            const content = get(contentSelector);
            return findElementParentWithChildrenById(content, element);
        };
    }
});

export const getElementParentWithChildrenById = (
    state: PbState,
    id: string
): PbElement | undefined => {
    const element = getElementById(state, id);
    if (!element) {
        return undefined;
    }
    return findElementParentWithChildrenById(state.content, element);
};
