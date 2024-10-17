import React, { createContext, useContext } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Element } from "~/types";
import { ElementInputs as TElementInputs, ElementInputValues } from "~/inputs/ElementInput";

type ElementRendererInputsContext<T extends TElementInputs = TElementInputs> =
    ElementInputValues<T>;

const ElementRendererInputsContext = createContext<ElementRendererInputsContext | undefined>(
    undefined
);

export interface ElementRendererInputsProps {
    element: Element;
    inputs: TElementInputs | undefined;
    values: ElementInputValues<any>;
    children: React.ReactNode;
}

const BaseElementInputs = ({ children, values }: ElementRendererInputsProps) => {
    return (
        <ElementRendererInputsContext.Provider value={values}>
            {children}
        </ElementRendererInputsContext.Provider>
    );
};

export const ElementRendererInputs = makeDecoratable("ElementRendererInputs", BaseElementInputs);

export function useElementInputs() {
    const context = useContext(ElementRendererInputsContext);
    if (!context) {
        throw new Error(`Missing <ElementInputs> provider in the component hierarchy!`);
    }

    return context;
}
