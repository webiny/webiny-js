import { PbShallowElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";

export const elementByIdSelector = selectorFamily<PbShallowElement, string>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            const elements = get(elementsAtom);
            if (elements.hasOwnProperty(id)) {
                return elements[id];
            }
            const element = Object.values(elements).find(el => el.path === id);
            // TODO verify that element not existing can ever happen actually?
            if (!element) {
                throw new Error(`There is no element with id or path "${id}"`);
            }
            return element;
        };
    }
});
