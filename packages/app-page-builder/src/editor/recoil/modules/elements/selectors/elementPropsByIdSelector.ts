import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementByIdSelector } from "./elementByIdSelector";
import { uiAtom, UiAtomType } from "../../ui/uiAtom";
import { highlightElementAtom, HighlightElementAtomType } from "../../ui/highlightElementAtom";

type ActiveElementPropsByIdSelector = {
    isActive: boolean;
    isHighlighted: boolean;
};
export const elementPropsByIdSelector = selectorFamily<ActiveElementPropsByIdSelector, string>({
    key: "elementPropsByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            if (!element) {
                return {
                    isActive: false,
                    isHighlighted: false
                };
            }
            const { isDragging, isResizing, activeElement } = get(uiAtom);
            const highlightElement = get(highlightElementAtom);

            const active = activeElement && activeElement === element.id;
            const highlight = active || highlightElement === id;

            return {
                isActive: active,
                isHighlighted: highlight && !isDragging && !isResizing
            };
        };
    }
});

type GetElementPropsCallableType = (
    highlightElementAtomValue: HighlightElementAtomType,
    state: UiAtomType,
    element?: PbElement | PbShallowElement
) => ActiveElementPropsByIdSelector;
export const getElementProps: GetElementPropsCallableType = (
    highlightElementAtomValue,
    state,
    element
) => {
    if (!element) {
        return {
            isActive: false,
            isHighlighted: false
        };
    }
    const { isDragging, isResizing, activeElement } = state;

    const active = activeElement && activeElement === element.id;
    const highlight = active || highlightElementAtomValue === element.id;

    return {
        isActive: active,
        isHighlighted: highlight && !isDragging && !isResizing
    };
};
