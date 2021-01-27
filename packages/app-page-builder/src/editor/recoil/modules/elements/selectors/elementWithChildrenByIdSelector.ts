import { selectorFamily } from "recoil";
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

            return ({
                ...element,
                elements: element.elements.map(id => get(elementByIdSelector(id)))
            } as any) as PbElement;
        };
    }
});
