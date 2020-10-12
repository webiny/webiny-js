import React, { useCallback } from "react";
import { elementByIdSelectorFamily } from "../recoil/recoil";
import { PbElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

type Props = {
    elementId: string;
    withChildElements?: boolean;
};
const ConnectedElement: React.FunctionComponent<Props> = ({
    children,
    elementId,
    withChildElements
}) => {
    const getElementFromRecoil = useCallback(
        (targetId: string, withChildren?: boolean) => {
            // TODO converting shallow elements to PbElements
            // fix and try to avoid this
            return (): PbElement => {
                const targetElement = (useRecoilValue(
                    elementByIdSelectorFamily(elementId)
                ) as unknown) as PbElement;
                if (!withChildren) {
                    return targetElement;
                }
                const targetElements = (targetElement.elements as unknown) as string[];
                const elements = (targetElements.map(id =>
                    useRecoilValue(elementByIdSelectorFamily(id))
                ) as unknown) as PbElement[];
                return {
                    ...targetElement,
                    elements
                };
            };
        },
        [children, elementId, withChildElements]
    );

    const element = getElementFromRecoil(elementId, withChildElements);

    if (typeof children === "function") {
        return children(element);
    }
    return children;
};
export default ConnectedElement;
