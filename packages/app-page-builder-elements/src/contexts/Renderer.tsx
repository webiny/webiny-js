import React, { createContext } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { RendererContextValue, RendererProviderProps } from "~/types";

export const RendererContext = createContext<RendererContextValue>(null as unknown as any);

export const RendererProvider: React.FC<RendererProviderProps> = ({
    children,
    element,
    attributes,
    loader,
    meta
}) => {
    const getElement = () => element;
    const getAttributes = () => attributes;
    const getLoader = () => loader;

    const pageElements = usePageElements();

    // @ts-ignore Resolve the `getElement` issue.
    const value: RendererContextValue = {
        ...pageElements,
        getElement,
        getAttributes,
        getLoader,
        meta
    };

    return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
};
