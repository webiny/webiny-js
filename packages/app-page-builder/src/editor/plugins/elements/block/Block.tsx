import React from "react";
import { PbEditorElement } from "~/types";
import PeBlock from "./PeBlock";
import { useElementWithChildrenById } from "~/editor/hooks/useElementById";
import { DynamicElementWrapper } from "~/editor/components/DynamicElementWrapper";
import { Element } from "@webiny/app-page-builder-elements/types";

interface BlockProps {
    element: PbEditorElement;
}

const Block = (props: BlockProps) => {
    const { element, ...rest } = props;
    const elementWithChildren = useElementWithChildrenById(element.id);

    if (
        elementWithChildren &&
        elementWithChildren.elements?.length &&
        elementWithChildren.data?.isVariantBlock
    ) {
        const variant =
            (elementWithChildren.elements as PbEditorElement[]).find(
                childElement => childElement.id === elementWithChildren.data?.selectedVariantId
            ) || elementWithChildren.elements[0];

        return (
            <DynamicElementWrapper element={element as Element}>
                <PeBlock element={variant as Element} {...rest} />
            </DynamicElementWrapper>
        );
    }

    return (
        <DynamicElementWrapper element={element as Element}>
            <PeBlock element={element as Element} {...rest} />
        </DynamicElementWrapper>
    );
};

export default Block;
