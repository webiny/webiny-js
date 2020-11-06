import React from "react";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const flattenElement = (
    element: PbElement,
    withChildElements: boolean
): PbElement | PbShallowElement => {
    if (!withChildElements) {
        return element;
    }
    return {
        ...element,
        elements: element.elements.map(el => el.id)
    };
};
type Props = {
    elementId: string;
    withChildElements?: boolean;
};
const ConnectedElement: React.FunctionComponent<Props> = ({
    children,
    elementId,
    withChildElements
}) => {
    const target = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!target) {
        return null;
    }
    const element = flattenElement(target, withChildElements);

    if (typeof children === "function") {
        return children(element);
    }
    return children;
};
export default ConnectedElement;
