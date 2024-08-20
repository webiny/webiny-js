import React, { createContext } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { GetElement, RendererContextValue, RendererProviderProps } from "~/types";
import { ElementInputs, ElementInputValues } from "~/inputs/ElementInput";
import { useElementInputs } from "~/contexts/ElementRendererInputs";

export const RendererContext = createContext<RendererContextValue | undefined>(undefined);

export const RendererProvider = ({
    children,
    element,
    attributes,
    meta
}: RendererProviderProps) => {
    const inputValues = useElementInputs();
    const getElement = (() => element) as GetElement;
    const getAttributes = () => attributes;
    const getInputValues = <TInputs extends ElementInputs>() => {
        return inputValues as ElementInputValues<TInputs>;
    };

    const pageElements = usePageElements();

    const value: RendererContextValue = {
        ...pageElements,
        beforeRenderer: pageElements.beforeRenderer ?? null,
        afterRenderer: pageElements.beforeRenderer ?? null,
        getElement,
        getAttributes,
        getInputValues,
        meta
    };

    return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
};
