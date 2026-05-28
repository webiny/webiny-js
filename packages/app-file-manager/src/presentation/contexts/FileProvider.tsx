import React, { createContext } from "react";
import type { FileItem } from "~/domain/types.js";

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
