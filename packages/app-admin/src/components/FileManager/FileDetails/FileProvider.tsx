import React, { createContext } from "react";
import { FileItem } from "~/components/FileManager/types";
import { FileDetailsProps } from "~/components/FileManager/FileDetails";

export interface FileContext {
    file: FileItem;
    isEditingAllowed: boolean;
}

const FileContext = createContext<FileContext | undefined>(undefined);

interface FileProviderProps {
    file: FileItem;
    canEdit: FileDetailsProps["canEdit"];
    children: React.ReactNode;
}

export const FileProvider = ({ file, canEdit, children }: FileProviderProps) => {
    const value: FileContext = { file, isEditingAllowed: canEdit(file) };

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
