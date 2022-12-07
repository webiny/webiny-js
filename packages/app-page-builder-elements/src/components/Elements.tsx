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
            {elements.map(element => (
                <Element key={element.id} element={element} />
            ))}
        </>
    );
};
