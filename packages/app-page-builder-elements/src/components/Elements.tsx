import React from "react";
import { Element as ElementType } from "~/types";
import { Element } from "./Element";

export interface Props {
    element: ElementType;
}

export const Elements: React.FC<Props> = props => {
    return (
        <>
            {props.element.elements.map(element => (
                <Element key={element.id} element={element} />
            ))}
        </>
    );
};
