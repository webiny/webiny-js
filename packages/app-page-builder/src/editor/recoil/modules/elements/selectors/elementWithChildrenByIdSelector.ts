import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { selectorFamily } from "recoil";
import { contentSelector } from "../../page/selectors/contentSelector";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbElement } from "@webiny/app-page-builder/types";

const extrapolateElement = (target: PbElement, paths: number[]): PbElement | undefined => {
    if (paths.length === 0) {
        throw new Error(`Cannot go in depths of "${target.path}".`);
    }
    const path = paths.shift();
    if (paths.length === 0) {
        return target;
    } else if (!target.elements || target.elements.length === 0) {
        throw new Error(`It seems there is no elements in target on path "${target.path}"`);
    }
    return extrapolateElement(target.elements[path], paths);
};

export const elementWithChildrenByIdSelector = selectorFamily<PbElement, string>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const { path } = get(elementByIdSelector(id));
            const content = get(contentSelector);
            const paths = path.split(".").map(Number);
            const element = extrapolateElement(content, paths);
            if (!element) {
                throw new Error(`Element with path "${path}" not found.`);
            }
            return element as PbElement;
        };
    }
});
export const getElementWithChildrenById = (state: PbState, id: string): PbElement | undefined => {
    const { path } = state.elements[id];
    const content = state.page.content;
    const paths = path.split(".").map(Number);
    const element = extrapolateElement(content, paths);
    if (!element) {
        return undefined;
    }
    return element as PbElement;
};
