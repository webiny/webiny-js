import { selectorFamily } from "recoil";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbEditorElement } from "~/types";

export const elementWithChildrenByIdSelector = selectorFamily<PbEditorElement | undefined, string>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }): PbEditorElement | undefined => {
            const element = get(elementByIdSelector(id));
            if (!element) {
                return undefined;
            }

            return {
                ...element,
                elements: element.elements.map((id: string) => get(elementByIdSelector(id)))
            };
        };
    }
});
