import React, { createContext } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { RendererContextValue, GetElement, GetLoader, RendererProviderProps } from "~/types";

export const RendererContext = createContext<RendererContextValue>(null as unknown as any);

export const RendererProvider: React.FC<RendererProviderProps> = ({
    children,
    element,
    attributes,
    loader,
    meta
}) => {
    const getElement = (() => element) as GetElement;
    const getAttributes = () => attributes;
    const getLoader = (() => loader) as GetLoader;

    const pageElements = usePageElements();

    const value: RendererContextValue = {
        ...pageElements,
        getElement,
        getAttributes,
        getLoader,
        meta,
        beforeRenderer: pageElements.beforeRenderer || null,
        afterRenderer: pageElements.afterRenderer || null
    };

    return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
};
