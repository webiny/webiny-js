import React, { createContext } from "react";
import { PageContextValue, PageProviderProps } from "~/types";

export const PageContext = createContext<PageContextValue>(null as unknown as any);

export const PageProvider: React.FC<PageProviderProps> = ({
    children,
    page,
    layout,
    layoutProps = {}
}) => {
    const value: PageContextValue = {
        page,
        layout,
        layoutProps
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const PageConsumer: React.FC = ({ children }) => (
    <PageContext.Consumer>
        {(props: any) => React.cloneElement(children as unknown as React.ReactElement, props)}
    </PageContext.Consumer>
);
