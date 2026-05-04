import React from "react";

import type { IFileDetailsPresenter } from "./abstractions.js";

interface FileDetailsPresenterProviderProps {
    presenter: IFileDetailsPresenter;
    children: React.ReactNode;
}

const FileDetailsPresenterContext = React.createContext<IFileDetailsPresenter | undefined>(
    undefined
);

export const FileDetailsPresenterProvider = ({
    presenter,
    children
}: FileDetailsPresenterProviderProps) => {
    return (
        <FileDetailsPresenterContext.Provider value={presenter}>
            {children}
        </FileDetailsPresenterContext.Provider>
    );
};

export function useFileDetailsPresenter(): IFileDetailsPresenter {
    const context = React.useContext(FileDetailsPresenterContext);
    if (!context) {
        throw Error(`Missing <FileDetailsPresenterProvider> in the component tree!`);
    }
    return context;
}
