import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import EmptyCell from "~/editor/plugins/elements/cell/EmptyCell";

const PeTab = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();

    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as Element;

    const childrenElements = elementWithChildren?.elements;
    if (Array.isArray(childrenElements) && childrenElements.length > 0) {
        return <Elements element={elementWithChildren} />;
    }

    return <EmptyCell element={element} />;
});

export default PeTab;
