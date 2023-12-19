import React from "react";
import { Element as ElementType } from "~/types";
import { Element } from "./Element";
import { useRenderer } from "~/hooks/useRenderer";

// All elements have a unique ID. The only exception are the elements
// nested in a pre-made block (a block created via the Blocks module).
// In that case, for every nested element, we make the key by joining:
// 1. the pre-made block's ID
// 2. an index of the nested element
const getElementKey = (
    element: ElementType,
    elementIndex: number,
    parentBlockElement?: ElementType
) => {
    if (parentBlockElement) {
        return `${parentBlockElement.id}-${elementIndex}`;
    }
    return element.id;
};

export interface ElementsProps {
    element: ElementType;
}

export const Elements = (props: ElementsProps) => {
    // `Elements` component is used within a renderer, meaning
    // we can always be sure `useRenderer` hook is available.
    const { meta: currentRendererMeta } = useRenderer();

    const elements = props.element.elements;

    let parentBlockElement: ElementType;
    if (props.element.data.blockId) {
        parentBlockElement = props.element;
    } else {
        parentBlockElement = currentRendererMeta.parentBlockElement;
    }

    let parentTemplateBlockElement: ElementType;
    if (props.element.data.templateBlockId) {
        parentTemplateBlockElement = props.element;
    } else {
        parentTemplateBlockElement = currentRendererMeta.parentTemplateBlockElement;
    }

    let parentDocumentElement: ElementType;
    if (props.element.type === "document") {
        parentDocumentElement = props.element;
    } else {
        parentDocumentElement = currentRendererMeta.parentDocumentElement;
    }

    return (
        <>
            {elements.map((element, index) => {
                const key = getElementKey(element, index, parentBlockElement);

                return (
                    <Element
                        key={key}
                        element={element}
                        meta={{
                            depth: (currentRendererMeta.depth || 0) + 1,
                            parentElement: props.element,
                            parentBlockElement,
                            parentTemplateBlockElement,
                            parentDocumentElement,
                            isFirstElement: index === 0,
                            isLastElement: index === elements.length - 1,
                            elementIndex: index,
                            collection: elements
                        }}
                    />
                );
            })}
        </>
    );
};
