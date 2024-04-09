import React, { createContext } from "react";

export interface PageContext<T = any> {
    page: T;
}

export const PageContext = createContext<PageContext | undefined>(undefined);

interface PageProviderProps<T> {
    page: T;
    children: React.ReactNode;
}

export function PageProvider<T>({ page, children }: PageProviderProps<T>) {
    const value: PageContext = { page };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function createUsePageHook<T>() {
    return () => {
        const context = React.useContext<PageContext<T>>(
            PageContext as unknown as React.Context<PageContext<T>>
        );

        if (!context) {
            throw Error(
                `PageContext is missing in the component tree. Are you using "usePage()" hook in the right place?`
            );
        }

        return context;
    };
}
