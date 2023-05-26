import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import EmptyCell from "~/editor/plugins/elements/cell/EmptyCell";

const PeBlock = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();

        const elementWithChildren = useRecoilValue(
            elementWithChildrenByIdSelector(element.id)
        ) as Element;

        const childrenElements = elementWithChildren?.elements;
        if (Array.isArray(childrenElements) && childrenElements.length > 0) {
            return (
                <>
                    <Elements element={elementWithChildren} />
                    {element.data.blockId && (
                        <ps-tag data-key={"pb-page-block"} data-value={element.data.blockId} />
                    )}
                </>
            );
        }

        return <EmptyCell element={element} />;
    },
    {
        baseStyles: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            boxSizing: "border-box"
        }
    }
);

export default PeBlock;
