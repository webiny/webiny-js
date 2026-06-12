import React from "react";
import type { IPageListPresenter } from "./abstractions.js";

const PageListPresenterContext = React.createContext<IPageListPresenter | undefined>(undefined);

interface PageListPresenterProviderProps {
    presenter: IPageListPresenter;
    children: React.ReactNode;
}

export const PageListPresenterProvider = ({
    presenter,
    children
}: PageListPresenterProviderProps) => (
    <PageListPresenterContext.Provider value={presenter}>
        {children}
    </PageListPresenterContext.Provider>
);

export function usePageListPresenter(): IPageListPresenter {
    const context = React.useContext(PageListPresenterContext);
    if (!context) {
        throw new Error("Missing <PageListPresenterProvider> in the component tree!");
    }
    return context;
}
