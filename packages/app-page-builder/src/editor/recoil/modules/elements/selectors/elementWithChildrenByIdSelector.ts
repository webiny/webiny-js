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
                /**
                 * We are positive that we can cast element.elements as string[] here
                 */
                elements: (element.elements as string[])
                    .map(id => get(elementByIdSelector(id)))
                    .filter(Boolean) as PbEditorElement[]
            };
        };
    }
});
