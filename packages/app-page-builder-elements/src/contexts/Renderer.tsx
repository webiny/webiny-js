import React, {createContext, useCallback} from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { RendererContextValue, RendererProviderProps } from "~/types";

export const RendererContext = createContext<RendererContextValue>(null as unknown as any);

export const RendererProvider: React.FC<RendererProviderProps> = ({
    children,
    element,
    attributes
}) => {

    const getElement = useCallback(() => element, []);
    const getAttributes = useCallback(() => attributes, []);

    const pageElements = usePageElements();
    const value: RendererContextValue = { ...pageElements, getElement, getAttributes };

    return <RendererContext.Provider value={value}>{children}</RendererContext.Provider>;
};

export const RendererConsumer: React.FC = ({ children }) => (
    <RendererContext.Consumer>
        {(props: any) => React.cloneElement(children as unknown as React.ReactElement, props)}
    </RendererContext.Consumer>
);
