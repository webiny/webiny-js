import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

const PeGrid = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();

        const elementWithChildren = useRecoilValue(
            elementWithChildrenByIdSelector(element.id)
        ) as Element;

        if (!elementWithChildren) {
            return null;
        }

        return <Elements element={elementWithChildren} />;
    },
    {
        baseStyles: {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "100%"
        }
    }
);

export default PeGrid;
