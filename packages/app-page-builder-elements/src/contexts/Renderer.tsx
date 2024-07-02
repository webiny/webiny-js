import React, { createContext } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { RendererContextValue, RendererProviderProps } from "~/types";

export const RendererContext = createContext<RendererContextValue>(
    null as unknown as RendererContextValue
);

export const RendererProvider = ({
    children,
    element,
    attributes,
    inputs,
    meta
}: RendererProviderProps) => {
    const getElement = () => element;
    const getAttributes = () => attributes;

    const pageElements = usePageElements();

    // @ts-expect-error Resolve the `getElement` issue.
    const value: RendererContextValue = { ...pageElements, getElement, getAttributes, meta, inputs };

    return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
};
