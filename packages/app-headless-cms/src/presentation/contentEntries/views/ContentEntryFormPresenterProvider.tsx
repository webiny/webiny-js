import React from "react";
import type { IContentEntryFormPresenter } from "../form/abstractions.js";

interface ContentEntryFormPresenterProviderProps {
    presenter: IContentEntryFormPresenter;
    children: React.ReactNode;
}

const ContentEntryFormPresenterContext = React.createContext<
    IContentEntryFormPresenter | undefined
>(undefined);

export const ContentEntryFormPresenterProvider = ({
    presenter,
    children
}: ContentEntryFormPresenterProviderProps) => {
    return (
        <ContentEntryFormPresenterContext.Provider value={presenter}>
            {children}
        </ContentEntryFormPresenterContext.Provider>
    );
};

export function useContentEntryFormPresenter(): IContentEntryFormPresenter {
    const context = React.useContext(ContentEntryFormPresenterContext);
    if (!context) {
        throw Error("Missing <ContentEntryFormPresenterProvider> in the component tree!");
    }
    return context;
}
