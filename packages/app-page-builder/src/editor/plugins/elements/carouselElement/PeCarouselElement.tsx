import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import styled from "@emotion/styled";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import EmptyCell from "~/editor/plugins/elements/cell/EmptyCell";

const PeCarouselElementWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const PeCarouselElement = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();

    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as Element;

    const childrenElements = elementWithChildren?.elements;

    if (Array.isArray(childrenElements) && childrenElements.length > 0) {
        return (
            <PeCarouselElementWrapper>
                <Elements element={elementWithChildren} />
            </PeCarouselElementWrapper>
        );
    }

    return <EmptyCell element={element} />;
});

export default PeCarouselElement;
