import React, { createContext } from "react";
import { FileItem } from "@webiny/app-admin/types";

export interface FileContext {
    file: FileItem;
}

export const FileContext = createContext<FileContext | undefined>(undefined);

interface FileProviderProps {
    file: FileItem;
    children: React.ReactNode;
}

export const FileProvider = ({ file, children }: FileProviderProps) => {
    const value: FileContext = { file };

    return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFile = () => {
    const context = React.useContext(FileContext);
    if (!context) {
        throw Error(
            `FileContext is missing in the component tree. Are you using "useFile()" hook in the right place?`
        );
    }

    return context;
};
