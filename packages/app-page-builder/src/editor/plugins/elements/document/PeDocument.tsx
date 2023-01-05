import { createRenderer, Elements, useRenderer } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import React from "react";

const PeDocument = createRenderer(() => {
    const { getElement } = useRenderer();

    const element = getElement();
    const elementWithChildren = useRecoilValue(elementWithChildrenByIdSelector(element.id));

    return <Elements element={elementWithChildren as Element} />;
});

export default PeDocument;
