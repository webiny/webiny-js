import React, { createContext } from "react";
import { PbPageTableItem } from "~/types";

export interface PageContext {
    page: PbPageTableItem;
}

export const PageContext = createContext<PageContext | undefined>(undefined);

interface PageProviderProps {
    page: PbPageTableItem;
    children: React.ReactNode;
}

export const PageProvider = ({ page, children }: PageProviderProps) => {
    const value: PageContext = { page };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePage = () => {
    const context = React.useContext(PageContext);
    if (!context) {
        throw Error(
            `PageContext is missing in the component tree. Are you using "usePage()" hook in the right place?`
        );
    }

    return context;
};
