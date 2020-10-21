import { PbShallowElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";

const findElementById = (elements: { [key: string]: PbShallowElement }, id: string) => {
    if (elements.hasOwnProperty(id)) {
        return elements[id];
    }
    return Object.values(elements).find(el => el.path === id);
};

export const elementByIdSelector = selectorFamily<PbShallowElement, string>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            const elements = get(elementsAtom);
            return findElementById(elements, id);
        };
    }
});
