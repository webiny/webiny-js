import { elementByIdSelector } from "./elementByIdSelector";
import { uiAtom } from "../../ui/uiAtom";
import { selectorFamily } from "recoil";

type ActiveElementPropsByIdSelector = {
    isActive: boolean;
    isHighlighted: boolean;
};
export const elementPropsByIdSelector = selectorFamily<ActiveElementPropsByIdSelector, string>({
    key: "elementPropsByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            const { isDragging, isResizing, activeElement, highlightElement } = get(uiAtom);

            const active = activeElement && activeElement === element.id;
            const highlight = active || highlightElement === id;

            return {
                isActive: active,
                isHighlighted: highlight && !isDragging && !isResizing
            };
        };
    }
});
