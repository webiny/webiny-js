import React from "react";
import { Element as ElementType } from "~/types";
import { Element } from "./Element";

export interface ElementsProps {
    element: ElementType;
    elements?: Array<ElementType>;
}

export const Elements: React.FC<ElementsProps> = props => {
    const elements = props.elements || props.element.elements;
    return (
        <>
            {elements.map((element, index) => (
                <Element
                    key={element.id}
                    element={element}
                    meta={{
                        parentElement: props.element,
                        elementsCollection: {
                            isFirstElement: index === 0,
                            isLastElement: index === elements.length - 1,
                            elementIndex: index,
                            collection: elements
                        }
                    }}
                />
            ))}
        </>
    );
};
