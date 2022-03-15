import React from "react";
import { Element as ElementType } from "~/types";
import { Element } from "./Element";

export interface ElementsProps {
    element: ElementType;
}

export const Elements: React.FC<ElementsProps> = props => {
    return (
        <>
            {props.element.elements.map(element => (
                <Element key={element.id} element={element} />
            ))}
        </>
    );
};
