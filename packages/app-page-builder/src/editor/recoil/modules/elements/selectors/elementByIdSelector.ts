import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { PbShallowElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementsAtom, ElementsAtomType } from "../elementsAtom";

const findOneElement = (elements: ElementsAtomType, id: string) => {
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
            return findOneElement(elements, id);
        };
    }
});

export const getElementById = (state: PbState, id: string): PbShallowElement | undefined => {
    return findOneElement(state.elements, id);
};
