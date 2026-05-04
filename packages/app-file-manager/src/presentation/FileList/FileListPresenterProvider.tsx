import React from "react";

import type { IFileListPresenter } from "./abstractions.js";

interface FileListPresenterProviderProps {
    presenter: IFileListPresenter;
    children: React.ReactNode;
}

const FileListPresenterContext = React.createContext<IFileListPresenter | undefined>(undefined);

export const FileListPresenterProvider = ({
    presenter,
    children
}: FileListPresenterProviderProps) => {
    return (
        <FileListPresenterContext.Provider value={presenter}>
            {children}
        </FileListPresenterContext.Provider>
    );
};

export function useFileListPresenter(): IFileListPresenter {
    const context = React.useContext(FileListPresenterContext);
    if (!context) {
        throw Error(`Missing <FileListPresenterProvider> in the component tree!`);
    }
    return context;
}
