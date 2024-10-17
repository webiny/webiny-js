import React from "react";
import { useRecoilValue } from "recoil";
import { BlockRenderer } from "@webiny/app-page-builder-elements/renderers/block";
import { Element } from "@webiny/app-page-builder-elements/types";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { EmptyCell } from "~/editor/plugins/elements/cell/EmptyCell";
import { PbEditorElement } from "~/types";

type Props = Omit<React.ComponentProps<typeof BlockRenderer>, "element"> & {
    element: PbEditorElement;
};

export const Block = (props: Props) => {
    const { element } = props;

    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as Element;

    const childrenElements = elementWithChildren?.elements;

    if (Array.isArray(childrenElements) && childrenElements.length > 0) {
        return <BlockRenderer {...props} element={elementWithChildren} />;
    }

    return <EmptyCell element={element} />;
};
