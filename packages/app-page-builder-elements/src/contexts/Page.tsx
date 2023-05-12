import React, { createContext } from "react";
import { Page, PageProviderProps } from "~/types";

export interface PageContext {
    page: Page;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
    layoutProps: Record<string, any>;
}

export const PageContext = createContext<PageContext | undefined>(undefined);

export const PageProvider: React.FC<PageProviderProps> = ({
    children,
    page,
    layout,
    layoutProps = {}
}) => {
    const value: PageContext = {
        page,
        layout,
        layoutProps
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
