import { selectorFamily } from "recoil";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbEditorElement } from "~/types";

export const elementWithChildrenByIdSelector = selectorFamily<
    PbEditorElement | null,
    string | null
>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }): PbEditorElement | null => {
            if (!id) {
                return null;
            }
            const element = get(elementByIdSelector(id));
            if (!element) {
                return null;
            }

            return {
                ...element,
                elements: element.elements.map((id: string) => get(elementByIdSelector(id)))
            };
        };
    }
});
