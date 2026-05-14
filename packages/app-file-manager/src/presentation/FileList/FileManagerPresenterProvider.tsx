import React from "react";

import type { IFileManagerPresenter } from "./abstractions.js";

interface FileManagerPresenterProviderProps {
    presenter: IFileManagerPresenter;
    children: React.ReactNode;
}

const FileManagerPresenterContext = React.createContext<IFileManagerPresenter | undefined>(
    undefined
);

export const FileManagerPresenterProvider = ({
    presenter,
    children
}: FileManagerPresenterProviderProps) => {
    return (
        <FileManagerPresenterContext.Provider value={presenter}>
            {children}
        </FileManagerPresenterContext.Provider>
    );
};

export function useFileManagerPresenter(): IFileManagerPresenter {
    const context = React.useContext(FileManagerPresenterContext);
    if (!context) {
        throw Error(`Missing <FileManagerPresenterProvider> in the component tree!`);
    }
    return context;
}
