import React from "react";
import type { IContentEntriesPresenter } from "../list/abstractions.js";

interface ContentEntriesPresenterProviderProps {
    presenter: IContentEntriesPresenter;
    children: React.ReactNode;
}

const ContentEntriesPresenterContext = React.createContext<IContentEntriesPresenter | undefined>(
    undefined
);

export const ContentEntriesPresenterProvider = ({
    presenter,
    children
}: ContentEntriesPresenterProviderProps) => {
    return (
        <ContentEntriesPresenterContext.Provider value={presenter}>
            {children}
        </ContentEntriesPresenterContext.Provider>
    );
};

export function useContentEntriesPresenter(): IContentEntriesPresenter {
    const context = React.useContext(ContentEntriesPresenterContext);
    if (!context) {
        throw Error("Missing <ContentEntriesPresenterProvider> in the component tree!");
    }
    return context;
}
