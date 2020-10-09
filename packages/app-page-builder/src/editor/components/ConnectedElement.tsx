import React, { useCallback } from "react";
import { elementByIdSelectorFamily } from "@webiny/app-page-builder/editor/components/recoil";
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
            return (): PbElement => {
                const targetElement = useRecoilValue(elementByIdSelectorFamily(elementId));
                if (!withChildren) {
                    return targetElement;
                }
                return {
                    ...targetElement,
                    elements: targetElement.elements.map(({ id }) =>
                        useRecoilValue(elementByIdSelectorFamily(id))
                    )
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
