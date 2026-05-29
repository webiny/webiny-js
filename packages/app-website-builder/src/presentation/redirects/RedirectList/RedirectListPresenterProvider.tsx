import React from "react";
import type { IRedirectListPresenter } from "./abstractions.js";

const RedirectListPresenterContext = React.createContext<IRedirectListPresenter | undefined>(
    undefined
);

interface RedirectListPresenterProviderProps {
    presenter: IRedirectListPresenter;
    children: React.ReactNode;
}

export const RedirectListPresenterProvider = ({
    presenter,
    children
}: RedirectListPresenterProviderProps) => (
    <RedirectListPresenterContext.Provider value={presenter}>
        {children}
    </RedirectListPresenterContext.Provider>
);

export function useRedirectListPresenter(): IRedirectListPresenter {
    const context = React.useContext(RedirectListPresenterContext);
    if (!context) {
        throw new Error("Missing <RedirectListPresenterProvider> in the component tree!");
    }
    return context;
}
